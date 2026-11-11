package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO.ScriptErrorDTO;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.script.ScriptException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Checks enhancement scripts by compiling them with the language's script engine.
 *
 * <p>Only JavaScript can be checked: the polyglot engine has no syntax check yet. The script is
 * compiled, never executed, so no user code runs on the server. Nashorn reports cryptic messages
 * for ES6 syntax (it runs ES5.1), so every error is paired with a hint telling the user how to
 * fix it.
 */
@Service
public class ScriptValidationServiceImpl implements ScriptValidationService {

  private static final int MAX_SCRIPT_LENGTH = 100_000;

  private static final Pattern ENGINE_PREFIX = Pattern.compile("^\\S+:\\d+:\\d+\\s+");
  private static final Pattern ENGINE_SUFFIX = Pattern.compile("\\s+in \\S+ at line number.*$");
  private static final Pattern EXPECTED_FOUND = Pattern.compile("^Expected (.+?) but found (.+)$");
  private static final Pattern WORD_BEFORE = Pattern.compile("([A-Za-z_$][\\w$]*)\\s*$");
  private static final Pattern ARROW = Pattern.compile("^\\)?\\s*=>");
  private static final Pattern LINE_BREAK = Pattern.compile("\\R");

  private static final String GENERIC_HINT =
      "Check the syntax at the reported line and column: brackets, quotes, commas and"
          + " semicolons.";
  private static final String RETURN_HINT =
      "'return' is only allowed inside a function. Remove it (the value of the last expression"
          + " in the script is the result) or wrap the code in (function () { ... })();";
  private static final String QUOTE_HINT =
      "A string is not closed. Add the matching quote on the same line; to continue a string on"
          + " the next line, close it and join the parts with +.";

  private final ScriptExecutionManager scriptExecutionManager;

  public ScriptValidationServiceImpl(ScriptExecutionManager scriptExecutionManager) {
    this.scriptExecutionManager = scriptExecutionManager;
  }

  @Override
  public ScriptValidationResultDTO validate(ScriptValidationRequest request) {
    String script = request == null ? null : request.script();
    if (script == null || script.isBlank()) {
      throw new GeneralServiceException("SCRIPT_IS_EMPTY", "Script must not be empty");
    }
    if (script.length() > MAX_SCRIPT_LENGTH) {
      throw new GeneralServiceException(
          "SCRIPT_TOO_LARGE",
          "Script must not be longer than %d characters".formatted(MAX_SCRIPT_LENGTH));
    }

    LanguageType language = resolveLanguage(request.language());
    ScriptEngine engine =
        scriptExecutionManager
            .resolveEngine(language)
            .orElseThrow(
                () ->
                    new GeneralServiceException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "SCRIPT_ENGINE_UNAVAILABLE",
                        "No script engine is available for '%s'".formatted(language.getCode())));

    try {
      engine.validate(script);
      return ScriptValidationResultDTO.valid(language.getCode());
    } catch (InvalidScriptException e) {
      return ScriptValidationResultDTO.invalid(language.getCode(), toError(e, script));
    }
  }

  private static LanguageType resolveLanguage(String code) {
    String normalized =
        code == null || code.isBlank()
            ? LanguageType.JS.getCode()
            : code.trim().toLowerCase(Locale.ROOT);
    return Arrays.stream(LanguageType.values())
        .filter(type -> type.getCode().equals(normalized))
        .filter(type -> type == LanguageType.JS)
        .findFirst()
        .orElseThrow(
            () ->
                new GeneralServiceException(
                    "UNSUPPORTED_LANGUAGE",
                    "Syntax check is not available for language '%s'; supported: %s"
                        .formatted(normalized, LanguageType.JS.getCode())));
  }

  private static ScriptErrorDTO toError(InvalidScriptException e, String script) {
    if (!(e.getCause() instanceof ScriptException cause)) {
      return new ScriptErrorDTO(null, null, e.getMessage(), null, GENERIC_HINT);
    }

    Integer line = cause.getLineNumber() > 0 ? cause.getLineNumber() : null;
    // Nashorn columns are 0-based; editors count from 1.
    Integer column = cause.getColumnNumber() >= 0 ? cause.getColumnNumber() + 1 : null;
    String codeLine = line == null ? null : lineAt(script, line).orElse(null);
    String message = engineMessage(cause);
    String hint = hint(message, codeLine, column == null ? -1 : column - 1);
    return new ScriptErrorDTO(line, column, message, codeLine, hint);
  }

  private static Optional<String> lineAt(String script, int line) {
    String[] lines = LINE_BREAK.split(script, -1);
    return line <= lines.length ? Optional.of(lines[line - 1]) : Optional.empty();
  }

  /** Strips the file/position prefix, the code excerpt and the position suffix Nashorn adds. */
  private static String engineMessage(ScriptException cause) {
    String raw = cause.getMessage() == null ? "" : cause.getMessage();
    int lineBreak = raw.indexOf('\n');
    String firstLine =
        lineBreak >= 0 ? raw.substring(0, lineBreak) : ENGINE_SUFFIX.matcher(raw).replaceFirst("");
    return ENGINE_PREFIX.matcher(firstLine).replaceFirst("").trim();
  }

  private static String hint(String message, String codeLine, int column) {
    boolean knownPosition = codeLine != null && column >= 0;
    String before = knownPosition ? codeLine.substring(0, Math.min(column, codeLine.length())) : "";
    String at = knownPosition && column < codeLine.length() ? codeLine.substring(column) : "";

    Matcher expectedFound = EXPECTED_FOUND.matcher(message);
    boolean matched = expectedFound.matches();
    String expected = matched ? expectedFound.group(1) : "";
    String found = matched ? expectedFound.group(2) : "";

    Optional<String> unsupported = unsupportedFeatureHint(expected, found, before, at);
    if (unsupported.isPresent()) {
      return unsupported.get();
    }
    if (message.startsWith("Invalid return statement")) {
      return RETURN_HINT;
    }
    if (message.startsWith("Missing close quote")) {
      return QUOTE_HINT;
    }
    return matched ? expectedFoundHint(expected, found) : GENERIC_HINT;
  }

  /** Recognizes ES6+ syntax, which Nashorn (ES5.1) reports as an ordinary syntax error. */
  private static Optional<String> unsupportedFeatureHint(
      String expected, String found, String before, String at) {
    Matcher word = WORD_BEFORE.matcher(before);
    String wordBefore = word.find() ? word.group(1) : "";

    if (at.startsWith("`")) {
      return es5Hint("Template literals", "Build the string with +, e.g. 'Hello ' + name.");
    }
    if (ARROW.matcher(at).lookingAt()) {
      return es5Hint(
          "Arrow functions", "Use a function expression, e.g. function (x) { return x * 2; }.");
    }
    if ("let".equals(wordBefore)) {
      return es5Hint("'let' declarations", "Use 'var' instead.");
    }
    if ("async".equals(wordBefore) || "await".equals(wordBefore)) {
      return es5Hint("'async' and 'await'", "Use a regular function; scripts run synchronously.");
    }
    if ("class".equals(found)) {
      return es5Hint("Classes", "Use a constructor function with prototype methods.");
    }
    if ("...".equals(found)) {
      return es5Hint(
          "Spread and rest syntax (...)", "Use array.concat(...) or fn.apply(null, args).");
    }
    if ("of".equals(found) && ";".equals(expected)) {
      return es5Hint(
          "'for...of' loops",
          "Use a classic for loop or array.forEach(function (item) { ... }).");
    }
    if ("ident".equals(expected) && ("{".equals(found) || "[".equals(found))) {
      return es5Hint("Destructuring", "Read the values one by one, e.g. var a = obj.a;");
    }
    if (",".equals(expected) && "=".equals(found)) {
      return es5Hint(
          "Default parameter values",
          "Set the default in the function body, e.g. if (a === undefined) { a = 1; }.");
    }
    if (".".equals(found) && before.endsWith("?")) {
      return es5Hint("Optional chaining (?.)", "Check each level, e.g. a && a.b.");
    }
    if ("*".equals(found) && before.endsWith("*")) {
      return es5Hint("The ** operator", "Use Math.pow(base, exponent).");
    }
    return Optional.empty();
  }

  private static Optional<String> es5Hint(String feature, String fix) {
    return Optional.of(
        "%s cannot be used: scripts run on JavaScript ES5.1. %s".formatted(feature, fix));
  }

  private static String expectedFoundHint(String expected, String found) {
    String token = "ident".equals(found) ? "a name" : "'" + found + "'";
    if ("eof".equals(found)) {
      return switch (expected) {
        case "}", ")", "]" ->
            "The script ends before every bracket is closed. Add the missing '%s'."
                .formatted(expected);
        case "comma", "," ->
            "The script ends inside an array, object or argument list. Add the missing ']', '}'"
                + " or ')'.";
        case "an operand" ->
            "The script ends in the middle of an expression. Complete the expression or remove"
                + " the trailing operator.";
        default -> "The script ends unexpectedly. Check that every bracket and quote is closed.";
      };
    }
    return switch (expected) {
      case "eof" ->
          "%s has no matching opening bracket. Remove it or add the missing opening bracket."
              .formatted(capitalize(token));
      case "an operand" ->
          ("A value is missing before %s. Check for a dangling or doubled operator"
                  + " (+, -, =, &&) or an extra comma.")
              .formatted(token);
      case "comma" ->
          "Elements of an array or object must be separated by commas. Add ',' before %s."
              .formatted(token);
      case "," ->
          ("Arguments must be separated by commas and the list closed with ')'. Add ',' or ')'"
                  + " before %s.")
              .formatted(token);
      case ";" ->
          ("%s cannot follow the previous code. End the previous statement with ';' or add the"
                  + " missing operator, and check that keywords are spelled correctly.")
              .formatted(capitalize(token));
      case "}", ")", "]" -> "Add the missing '%s' before %s.".formatted(expected, token);
      case "ident" ->
          ("A name is expected before %s. Check variable declarations, function parameters"
                  + " and property names.")
              .formatted(token);
      default -> "'%s' is expected before %s.".formatted(expected, token);
    };
  }

  private static String capitalize(String text) {
    return Character.toUpperCase(text.charAt(0)) + text.substring(1);
  }
}
