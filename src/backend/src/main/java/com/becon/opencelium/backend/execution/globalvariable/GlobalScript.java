package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.openjdk.nashorn.api.tree.CompilationUnitTree;
import org.openjdk.nashorn.api.tree.Diagnostic;
import org.openjdk.nashorn.api.tree.FunctionCallTree;
import org.openjdk.nashorn.api.tree.FunctionDeclarationTree;
import org.openjdk.nashorn.api.tree.FunctionExpressionTree;
import org.openjdk.nashorn.api.tree.IdentifierTree;
import org.openjdk.nashorn.api.tree.Parser;
import org.openjdk.nashorn.api.tree.ReturnTree;
import org.openjdk.nashorn.api.tree.SimpleTreeVisitorES5_1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * The definition of a script variable: a function body in a language, with declared parameters.
 *
 * <p>An enhancement imports the script as one of its args, {@code //var VAR_1 =
 * {{global.formatDate}};}, and its code calls it as a function, {@code VAR_1(VAR_0, 'dd.MM')}.
 * The script is meant as a pure function: it uses only its parameters, so its JavaScript code may
 * not call {@code ref()} or {@code set()}, which reach the workflow and its variables.
 *
 * <p>A script is written in JavaScript, which runs on Nashorn in the core, or in Python 3 or Ruby,
 * which run on the polyglot service. The backend cannot parse those two, so their code is checked
 * on that service, by running {@link #checkSource} there.
 *
 * <p>The definition is stored as JSON in the {@code value} column of the variable, the form
 * {@link #toJson} writes, so the change log and restore treat a script like any value.
 *
 * @param language   code of the language, as {@link LanguageType} names it: {@code js},
 *                   {@code python3} or {@code ruby}
 * @param code       the body of the function, which returns the result
 * @param parameters the declared parameters, in the order a call passes them
 */
public record GlobalScript(String language, String code, List<Parameter> parameters) {

    /** How long an enhancement that imports a script may run, unless configured otherwise. */
    public static final Duration DEFAULT_TIME_LIMIT = Duration.ofSeconds(5);

    private static final Logger log = LoggerFactory.getLogger(GlobalScript.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String FUNCTION_NAME = "OC_SCRIPT";
    private static final Set<String> LANGUAGES =
            Set.of(LanguageType.JS.getCode(), LanguageType.PYTHON_3.getCode(), LanguageType.RUBY.getCode());
    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z_$][A-Za-z0-9_$]*");
    private static final int DESCRIPTION_MAX_LENGTH = 512;
    // calls that reach the workflow or its variables, which a pure function does not do
    private static final Set<String> IMPURE_CALLS = Set.of("ref", "set");
    // ES5 keywords and reserved words, and the names a parameter would hide
    private static final Set<String> RESERVED = Set.of(
            "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally",
            "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try",
            "typeof", "var", "void", "while", "with", "class", "const", "enum", "export", "extends", "import",
            "super", "implements", "interface", "let", "package", "private", "protected", "public", "static",
            "yield", "null", "true", "false", "arguments", "eval", "undefined", "NaN", "Infinity");

    /** The binding that carries the code to {@link #checkSource}, as a text. */
    public static final String CHECK_CODE = "OC_CHECK_CODE";

    // the parameter of a Python or Ruby script that takes the arguments past the declared ones
    private static final String EXTRA = "extra";

    private static final Pattern PYTHON_IDENTIFIER = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");
    private static final Set<String> PYTHON_KEYWORDS = Set.of(
            "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue",
            "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in",
            "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield");
    // co_flags bit of a Python function whose body uses 'yield' and so returns a generator
    private static final int PYTHON_GENERATOR_FLAG = 0x20;

    // a Ruby parameter is a local variable, which starts in lower case; a method may start in upper
    private static final Pattern RUBY_PARAMETER = Pattern.compile("[a-z_][A-Za-z0-9_]*");
    private static final Pattern RUBY_METHOD = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");
    private static final Set<String> RUBY_KEYWORDS = Set.of(
            "__ENCODING__", "__LINE__", "__FILE__", "BEGIN", "END", "alias", "and", "begin", "break", "case",
            "class", "def", "defined?", "do", "else", "elsif", "end", "ensure", "false", "for", "if", "in",
            "module", "next", "nil", "not", "or", "redo", "rescue", "retry", "return", "self", "super", "then",
            "true", "undef", "unless", "until", "when", "while", "yield");

    /**
     * One declared parameter.
     *
     * @param name         the name the code reads it by
     * @param description  free text for the person who calls the script
     * @param required     whether a call must pass it
     * @param defaultValue what a call that leaves it out gets; {@code null} when it is required
     */
    public record Parameter(
            String name,
            String description,
            boolean required,
            @JsonProperty("default") JsonNode defaultValue) {

        public Parameter {
            // a required parameter has no default; an optional one without a default gets null
            if (required) {
                defaultValue = null;
            } else if (defaultValue == null) {
                defaultValue = NullNode.getInstance();
            }
        }
    }

    public GlobalScript {
        parameters = parameters == null ? List.of() : List.copyOf(parameters);
    }

    /**
     * Reads a definition from the JSON text {@link #toJson} wrote.
     *
     * @throws IllegalStateException if the text is not such a definition
     */
    public static GlobalScript fromJson(String json) {
        try {
            return MAPPER.readValue(json, GlobalScript.class);
        } catch (JsonProcessingException | IllegalArgumentException e) {
            // writes only ever store a checked definition, so the row was changed outside the API
            throw new IllegalStateException("A stored script variable is not a valid script definition", e);
        }
    }

    /** Returns the definition as the JSON text the {@code value} column stores. */
    public String toJson() {
        try {
            return MAPPER.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("A script definition could not be written as JSON", e);
        }
    }

    /**
     * Checks the definition as saving it requires: a language that is available, valid
     * parameters, and code. JavaScript code must parse as the body of the function, return a
     * value and call neither {@code ref()} nor {@code set()}. Python and Ruby code is only
     * checked for being there: its syntax is checked on the polyglot service, with {@link
     * #checkSource}. A Python script that ends without {@code return} returns {@code None}, and a
     * Ruby script returns its last expression, as a Ruby method does; {@code None} and {@code
     * nil} are null.
     *
     * @return what is wrong, each on its request field ({@code script.code}, {@code
     *         script.parameters[1].name}, ...); empty when the definition can be saved
     */
    public List<Violation> check() {
        List<Violation> violations = new ArrayList<>();

        if (!LANGUAGES.contains(language)) {
            violations.add(new Violation("script.language", Code.LANGUAGE_NOT_SUPPORTED,
                    "Script variables are written in JavaScript (js), Python 3 (python3) or Ruby (ruby), not in '%s'"
                            .formatted(language)));
        }
        boolean parametersValid = checkParameters(violations);
        if (code == null || code.isBlank()) {
            violations.add(new Violation("script.code", Code.SCRIPT_REQUIRED, "The code of the script is required"));
        } else if (parametersValid && violations.isEmpty() && !runsOnPolyglotService()) {
            // the code is parsed only once the function around it can be built
            checkCode(violations);
        }

        return violations;
    }

    /** Tells whether the script is written in Python 3, which runs on the polyglot service. */
    @JsonIgnore // not part of the stored definition
    public boolean isPython() {
        return LanguageType.PYTHON_3.getCode().equals(language);
    }

    /** Tells whether the script is written in Ruby, which runs on the polyglot service. */
    @JsonIgnore // not part of the stored definition
    public boolean isRuby() {
        return LanguageType.RUBY.getCode().equals(language);
    }

    /**
     * Tells whether the script runs on the polyglot service, as Python and Ruby do, and so is
     * checked there too.
     */
    @JsonIgnore // not part of the stored definition
    public boolean runsOnPolyglotService() {
        return isPython() || isRuby();
    }

    private String languageName() {
        return isPython() ? "Python" : isRuby() ? "Ruby" : "JavaScript";
    }

    private boolean checkParameters(List<Violation> violations) {
        int before = violations.size();
        Set<String> seen = new HashSet<>();

        for (int i = 0; i < parameters.size(); i++) {
            Parameter parameter = parameters.get(i);
            String field = "script.parameters[" + i + "]";

            if (parameter == null || parameter.name() == null || !isIdentifier(parameter.name())) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID, parameterNameRule()));
            } else if (runsOnPolyglotService() && EXTRA.equals(parameter.name())) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID,
                        "'%s' takes the extra arguments of a %s script".formatted(EXTRA, languageName())));
            } else if (isReserved(parameter.name())) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID,
                        "'%s' is a reserved word in %s".formatted(parameter.name(), languageName())));
            } else if (!seen.add(parameter.name())) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID,
                        "Parameter '%s' is declared twice".formatted(parameter.name())));
            } else if (parameter.description() != null && parameter.description().length() > DESCRIPTION_MAX_LENGTH) {
                violations.add(new Violation(field + ".description", Code.PARAMETER_INVALID,
                        "A parameter description has at most " + DESCRIPTION_MAX_LENGTH + " characters"));
            }
        }

        return violations.size() == before;
    }

    private String parameterNameRule() {
        if (isPython()) {
            return "A parameter name has letters, digits or '_' and does not start with a digit";
        }
        if (isRuby()) {
            return "A parameter name has letters, digits or '_' and starts with a lowercase letter or '_'";
        }
        return "A parameter name has letters, digits, '_' or '$' and does not start with a digit";
    }

    private boolean isIdentifier(String name) {
        Pattern pattern = isPython() ? PYTHON_IDENTIFIER : isRuby() ? RUBY_PARAMETER : IDENTIFIER;
        return pattern.matcher(name).matches();
    }

    private boolean isReserved(String name) {
        return (isPython() ? PYTHON_KEYWORDS : isRuby() ? RUBY_KEYWORDS : RESERVED).contains(name);
    }

    private void checkCode(List<Violation> violations) {
        Parsed parsed = parse();
        if (parsed.error() != null) {
            violations.add(new Violation("script.code", Code.SCRIPT_SYNTAX, parsed.error().describe()));
            return;
        }

        ShapeFinder shape = new ShapeFinder();
        parsed.unit().getSourceElements().get(0).accept(shape, 0);
        if (!shape.impureCalls.isEmpty()) {
            violations.add(new Violation("script.code", Code.SCRIPT_NOT_PURE,
                    "A script uses only its parameters, so it cannot call " + String.join(" or ", shape.impureCalls)));
        }
        if (!shape.returnsValue) {
            violations.add(new Violation("script.code", Code.NO_RETURN_VALUE,
                    "The script must return a value with 'return <value>;'"));
        }
    }

    /**
     * A change of the declared parameters that breaks calls made to the script before it.
     *
     * @param parameter the parameter the change is about: an old one for a removal, a move or a
     *                  parameter made required; a new one for a required parameter added
     * @param change    what happens to it, as a clause of a sentence, e.g. {@code parameter
     *                  'pattern' is removed}
     */
    public record BreakingChange(String parameter, String change) {
    }

    /**
     * Tells whether {@code changed} breaks calls made to this script. A call passes its
     * arguments by position, so every parameter keeps its name and position, an optional one
     * stays optional, and a parameter added after them has a default. Renaming a parameter in
     * place counts as removing it: whether its meaning stayed cannot be told.
     *
     * @return the first change that breaks calls, or nothing if every call still fits
     */
    public Optional<BreakingChange> breakingChangeTo(GlobalScript changed) {
        List<Parameter> next = changed.parameters();
        for (int i = 0; i < parameters.size(); i++) {
            Parameter old = parameters.get(i);
            if (i >= next.size()) {
                return Optional.of(new BreakingChange(old.name(),
                        "parameter '%s' is removed".formatted(old.name())));
            }
            Parameter now = next.get(i);
            if (!Objects.equals(old.name(), now.name())) {
                return Optional.of(new BreakingChange(old.name(),
                        "parameter '%s' is no longer parameter %d".formatted(old.name(), i + 1)));
            }
            if (now.required() && !old.required()) {
                return Optional.of(new BreakingChange(old.name(),
                        "parameter '%s' becomes required".formatted(old.name())));
            }
        }
        for (int i = parameters.size(); i < next.size(); i++) {
            Parameter added = next.get(i);
            if (added.required()) {
                return Optional.of(new BreakingChange(added.name(),
                        "new parameter '%s' has no default".formatted(added.name())));
            }
        }

        return Optional.empty();
    }

    /**
     * Tells whether {@code changed} declares the parameters a call sees differently: their
     * names, order, whether they are required and their defaults. Descriptions do not count.
     */
    public boolean changesSignature(GlobalScript changed) {
        return !signatureOf(parameters).equals(signatureOf(changed.parameters()));
    }

    private static List<Parameter> signatureOf(List<Parameter> parameters) {
        return parameters.stream()
                .map(parameter -> new Parameter(parameter.name(), null, parameter.required(), parameter.defaultValue()))
                .toList();
    }

    /**
     * Returns code in the language of the script that defines {@code variable} as a function an
     * enhancement calls: JavaScript as {@link #jsFunctionSource} writes it, Python as {@link
     * #pythonFunctionSource} writes it, Ruby as {@link #rubyFunctionSource} writes it.
     *
     * @param variable   name of the enhancement arg that imports the script, e.g. {@code VAR_1}
     * @param scriptName name of the script variable, for the errors
     * @throws IllegalArgumentException if {@code variable} is not an identifier of the language
     */
    public String functionSource(String variable, String scriptName) {
        // in Ruby the import is a method, whose name, unlike a parameter's, may start in upper case
        boolean named = variable != null && (isRuby()
                ? RUBY_METHOD.matcher(variable).matches() && !RUBY_KEYWORDS.contains(variable)
                : isIdentifier(variable) && !isReserved(variable));
        if (!named) {
            throw new IllegalArgumentException("'%s' cannot name an imported script".formatted(variable));
        }
        if (isPython()) {
            return pythonFunctionSource(variable, scriptName);
        }
        return isRuby() ? rubyFunctionSource(variable, scriptName) : jsFunctionSource(variable, scriptName);
    }

    /**
     * Returns JavaScript that defines {@code variable} as a function an enhancement calls: {@code
     * var VAR_1 = ...;}. The function takes the declared parameters in order and extra arguments
     * after them. It fails when a required parameter is missing, fills in the default of an
     * optional one that is left out or {@code undefined}, names the script in an error the code
     * throws, and fails when the code returns {@code undefined}. The code sees its parameters and
     * {@code arguments}; nothing keeps it from reading the enhancement's globals, which is
     * documented, not enforced.
     */
    private String jsFunctionSource(String variable, String scriptName) {
        String label = jsString("Script variable '" + scriptName + "'");

        StringBuilder js = new StringBuilder()
                .append("var ").append(variable).append(" = (function () {\n")
                .append(functionSource()).append('\n')
                .append("return function () {\n")
                .append("var OC_ARGS = Array.prototype.slice.call(arguments);\n");
        for (int i = 0; i < parameters.size(); i++) {
            Parameter parameter = parameters.get(i);
            js.append("if (OC_ARGS[").append(i).append("] === undefined) { ");
            if (parameter.required()) {
                js.append("throw new Error(").append(label).append(" + ")
                        .append(jsString(": parameter '" + parameter.name() + "' is missing")).append(");");
            } else {
                // written out per call, so a call that changes a default object changes only its own
                js.append("OC_ARGS[").append(i).append("] = ").append(jsLiteral(parameter.defaultValue())).append(';');
            }
            js.append(" }\n");
        }

        return js.append("var OC_RESULT;\n")
                .append("try { OC_RESULT = ").append(FUNCTION_NAME).append(".apply(null, OC_ARGS); }\n")
                .append("catch (e) { throw new Error(").append(label).append(" + ': ' + e); }\n")
                .append("if (OC_RESULT === undefined) { throw new Error(").append(label)
                .append(" + ' returned nothing'); }\n")
                .append("return OC_RESULT;\n")
                .append("};\n")
                .append("})();\n")
                .toString();
    }

    /**
     * Returns Python that defines {@code variable} as a function an enhancement calls: {@code
     * VAR_1 = ...}. The code is parsed with {@code ast} and becomes the body of {@code def
     * OC_SCRIPT(<parameters>, *extra)}, so it keeps its own lines and needs no indenting; it runs
     * with only the builtins as its globals, so it cannot read the enhancement's args. The
     * function fails when a required parameter is left out, fills in the default of an optional
     * one that is left out, and names the script in an error the code raises. A {@code None}
     * passed for a parameter stays {@code None}, as {@code null} does in JavaScript. Code that
     * ends without {@code return} returns {@code None}, which is null. Only the defined
     * function is left behind in the enhancement's globals.
     */
    private String pythonFunctionSource(String variable, String scriptName) {
        String factory = "_oc_import_" + variable;
        String label = jsString("Script variable '" + scriptName + "'");

        StringBuilder py = new StringBuilder()
                .append("def ").append(factory).append("():\n")
                .append("    import json\n")
                .append(pythonBuild("    ", jsString(code), jsString("<script variable " + scriptName + ">")))
                .append("    def call(*args):\n")
                .append("        args = list(args)\n");
        for (int i = 0; i < parameters.size(); i++) {
            Parameter parameter = parameters.get(i);
            py.append("        if len(args) <= ").append(i).append(":\n");
            if (parameter.required()) {
                py.append("            raise Exception(").append(label).append(" + ")
                        .append(jsString(": parameter '" + parameter.name() + "' is missing")).append(")\n");
            } else {
                // read per call, so a call that changes a default object changes only its own
                py.append("            args.append(json.loads(").append(jsString(jsLiteral(parameter.defaultValue())))
                        .append("))\n");
            }
        }

        return py.append("        try:\n")
                .append("            return script(*args)\n")
                .append("        except Exception as e:\n")
                .append("            raise Exception(").append(label)
                .append(" + ': ' + type(e).__name__ + ': ' + str(e))\n")
                .append("    return call\n")
                .append(variable).append(" = ").append(factory).append("()\n")
                .append("del ").append(factory).append('\n')
                .toString();
    }

    /**
     * Returns code that checks the code of this script on the polyglot service, given as the text
     * binding {@link #CHECK_CODE}, by building its function as an import does, without calling it.
     * Its answer, which {@link #checkResult} reads, says the code is fine, or gives what is wrong
     * with the line in the code, from 1.
     *
     * @throws IllegalStateException for a JavaScript script, which the backend checks itself
     */
    public String checkSource() {
        if (isPython()) {
            return pythonCheckSource();
        }
        if (isRuby()) {
            return rubyCheckSource();
        }
        throw new IllegalStateException("A JavaScript script is checked in the backend, not on the polyglot service");
    }

    /**
     * Returns code that calls {@code function}, an import of this script, with the arguments
     * that the text binding {@code argumentsBinding} holds as a JSON array, and sets {@code
     * RESULT_VAR} to the result as JSON text. The polyglot service passes every number inside a
     * structure as a float; JSON text keeps 1 apart from 1.0, both ways.
     *
     * @throws IllegalStateException for a JavaScript script, which runs in the backend
     */
    public String testCallSource(String function, String argumentsBinding) {
        if (isPython()) {
            return "import json\n"
                    + "RESULT_VAR = json.dumps(" + function + "(*json.loads(" + argumentsBinding + ")), "
                    + "allow_nan=False)\n"
                    + "RESULT_VAR\n";
        }
        if (isRuby()) {
            return "require 'json'\n"
                    + "RESULT_VAR = JSON.generate(" + function + "(*JSON.parse(" + argumentsBinding + ")))\n";
        }
        throw new IllegalStateException("A JavaScript script runs in the backend, not on the polyglot service");
    }

    /**
     * Returns Python that checks the code of this script. It evaluates to a dict: {@code {"ok":
     * True}}, or {@code {"ok": False, "line": ..., "column": ..., "message": ...}} when the code
     * does not parse or uses {@code yield}, which would make the function return a generator
     * instead of a value.
     */
    private String pythonCheckSource() {
        return "def _oc_check():\n"
                + "    try:\n"
                + pythonBuild("        ", CHECK_CODE, jsString("<script>"))
                + "    except (SyntaxError, ValueError) as e:\n"
                + "        return {'ok': False, 'line': getattr(e, 'lineno', None), "
                + "'column': getattr(e, 'offset', None), 'message': getattr(e, 'msg', str(e))}\n"
                + "    if script.__code__.co_flags & " + PYTHON_GENERATOR_FLAG + ":\n"
                + "        return {'ok': False, 'line': None, 'column': None, "
                + "'message': \"The script returns a value, so it cannot use 'yield'\"}\n"
                + "    return {'ok': True}\n"
                // the polyglot service answers with RESULT_VAR or with the last expression
                + "RESULT_VAR = _oc_check()\n"
                + "RESULT_VAR\n";
    }

    /**
     * Returns Ruby that checks the code of this script: it builds the lambda an import builds,
     * which parses the code but runs none of it. It sets {@code RESULT_VAR} to JSON text: {@code
     * {"ok": true}}, or {@code {"ok": false, "line": ..., "column": null, "message": ...}} when
     * the code does not parse; Ruby gives the line of a syntax error, not its column.
     */
    private String rubyCheckSource() {
        return "require 'json'\n"
                + "RESULT_VAR = lambda do\n"
                + "  begin\n"
                + "    eval(" + rubyString(rubyLambdaHeader() + "\n") + " + " + CHECK_CODE + " + "
                + rubyString("\nend") + ", Object.new.instance_eval { binding }, '<script>', 0)\n"
                + "    JSON.generate('ok' => true)\n"
                + "  rescue SyntaxError => e\n"
                + "    line = e.message[/<script>:(\\d+)/, 1]\n"
                // an error at the end of the code is found at the 'end' that closes the lambda
                + "    line = [line.to_i, " + CHECK_CODE + ".lines.count].min if line\n"
                + "    message = e.message.sub(/\\A[\\s\\S]*?<script>:\\d+:\\s*/, '').lines.first.to_s.strip\n"
                + "    JSON.generate('ok' => false, 'line' => line && line.to_i, 'column' => nil, "
                + "'message' => message)\n"
                + "  end\n"
                + "end.call\n";
    }

    /**
     * Reads what {@link #checkSource} answered on the polyglot service: a map, or JSON text of
     * one.
     *
     * @return the syntax error of the code, or nothing when the code can be saved
     * @throws IllegalStateException if the answer is not the one the check gives
     */
    public static Optional<SyntaxError> checkResult(Object answer) {
        Object read = answer;
        if (answer instanceof String text) {
            try {
                read = MAPPER.readValue(text, Map.class);
            } catch (JsonProcessingException e) {
                read = null;
            }
        }
        if (!(read instanceof Map<?, ?> fields) || !(fields.get("ok") instanceof Boolean ok)) {
            throw new IllegalStateException("The polyglot service gave no answer to the syntax check: " + answer);
        }
        if (ok) {
            return Optional.empty();
        }

        Long line = fields.get("line") instanceof Number number ? number.longValue() : null;
        Long column = line != null && fields.get("column") instanceof Number number ? number.longValue() : null;
        return Optional.of(new SyntaxError(line, column, String.valueOf(fields.get("message"))));
    }

    /**
     * Returns Python lines, each starting with {@code indent}, that set {@code script} to the
     * function of the declared parameters whose body is the code {@code codeExpression}
     * evaluates to. The code keeps its own line numbers; a syntax error is raised as {@code
     * SyntaxError} with the line in the code.
     */
    private String pythonBuild(String indent, String codeExpression, String fileExpression) {
        String header = parameters.stream().map(Parameter::name)
                .collect(Collectors.joining(", ", "def " + FUNCTION_NAME + "(", ""))
                + (parameters.isEmpty() ? "" : ", ") + "*" + EXTRA + "): pass";

        return Stream.of(
                        "import ast",
                        "tree = ast.parse(" + codeExpression + ", " + fileExpression + ", 'exec')",
                        "function = ast.parse(" + jsString(header) + ").body[0]",
                        // code of comments alone has no statement, and a function needs one
                        "function.body = tree.body or [ast.Pass()]",
                        "module = ast.Module(body=[function], type_ignores=[])",
                        "ast.fix_missing_locations(module)",
                        "namespace = {}",
                        "exec(compile(module, " + fileExpression + ", 'exec'), namespace)",
                        "script = namespace[" + jsString(FUNCTION_NAME) + "]")
                .map(line -> indent + line + "\n")
                .collect(Collectors.joining());
    }

    /**
     * Returns Ruby that defines {@code variable} as a method an enhancement calls: {@code
     * VAR_1(...)}. The code becomes the body of {@code lambda do |<parameters>, *extra| ... end},
     * built with {@code eval} in a binding of its own, so it keeps its own lines and cannot read
     * the enhancement's args, and {@code return} in it returns from the script. The method fails
     * when a required parameter is left out, fills in the default of an optional one that is left
     * out, and names the script in an error the code raises. A {@code nil} passed for a parameter
     * stays {@code nil}. The script returns what its last expression gives, as a Ruby method
     * does; {@code nil} is null. The polyglot service runs each enhancement in a Ruby runtime of
     * its own, so the method lives only as long as the enhancement.
     */
    private String rubyFunctionSource(String variable, String scriptName) {
        String label = rubyString("Script variable '" + scriptName + "'");

        StringBuilder rb = new StringBuilder()
                .append("require 'json'\n")
                .append("lambda do\n")
                .append("  script = eval(").append(rubyString(rubyLambdaHeader() + "\n" + code + "\nend"))
                .append(", Object.new.instance_eval { binding }, ")
                .append(rubyString("<script variable " + scriptName + ">")).append(", 0)\n")
                .append("  Object.send(:define_method, :").append(variable).append(") do |*args|\n");
        for (int i = 0; i < parameters.size(); i++) {
            Parameter parameter = parameters.get(i);
            if (parameter.required()) {
                rb.append("    raise ").append(label).append(" + ")
                        .append(rubyString(": parameter '" + parameter.name() + "' is missing"));
            } else {
                // parsed per call, so a call that changes a default object changes only its own
                rb.append("    args << JSON.parse(").append(rubyString(jsLiteral(parameter.defaultValue())))
                        .append(')');
            }
            rb.append(" if args.length <= ").append(i).append('\n');
        }

        return rb.append("    begin\n")
                .append("      script.call(*args)\n")
                .append("    rescue StandardError => e\n")
                .append("      raise ").append(label).append(" + ': ' + e.class.name + ': ' + e.message\n")
                .append("    end\n")
                .append("  end\n")
                .append("end.call\n")
                .toString();
    }

    /** Returns the head of the Ruby lambda of the script: {@code lambda do |a, b, *extra|}. */
    private String rubyLambdaHeader() {
        return parameters.stream().map(Parameter::name)
                .collect(Collectors.joining(", ", "lambda do |", ""))
                + (parameters.isEmpty() ? "" : ", ") + "*" + EXTRA + "|";
    }

    /** Returns a single-quoted Ruby string literal, in which only a quote and a backslash are escaped. */
    private static String rubyString(String text) {
        return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    /**
     * Runs {@code work} on a thread of its own and stops that thread once {@code limit} has
     * passed. Nashorn cannot be interrupted inside a loop, so a script that runs on is stopped
     * with {@link Thread#stop()}: it shares nothing with the run but the values it was given,
     * which it cannot corrupt. On Java 20 and later, where that is gone, the thread is left to
     * end by itself and the run goes on all the same. An interrupt of the calling thread, such as
     * the termination of a run, stops the work too.
     *
     * @param what names the work in the error, e.g. the enhancement
     * @throws TimeLimitExceeded       if the work takes longer than {@code limit}
     * @throws ScriptExecutionException if the calling thread is interrupted; whatever the work
     *                                  throws is thrown as it is
     */
    public static <T> T runWithin(Duration limit, String what, Supplier<T> work) {
        FutureTask<T> task = new FutureTask<>(work::get);
        Thread worker = new Thread(task, "oc-global-script");
        worker.setDaemon(true);
        worker.start();

        try {
            return task.get(limit.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            stop(worker);
            throw new TimeLimitExceeded("%s ran longer than %d ms and was stopped".formatted(what, limit.toMillis()));
        } catch (InterruptedException e) {
            stop(worker);
            Thread.currentThread().interrupt();
            throw new ScriptExecutionException(what + " was interrupted", e);
        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            if (cause instanceof Error error) {
                throw error;
            }
            throw new ScriptExecutionException(cause.getMessage(), cause);
        }
    }

    /** Thrown when code that calls a script variable runs longer than its limit. */
    public static final class TimeLimitExceeded extends ScriptExecutionException {

        public TimeLimitExceeded(String message) {
            super(message);
        }
    }

    @SuppressWarnings({"deprecation", "removal"})
    private static void stop(Thread worker) {
        try {
            worker.stop();
        } catch (UnsupportedOperationException e) {
            log.warn("Thread {} cannot be stopped on this Java version and runs on until it ends", worker.getName());
        }
    }

    // a JavaScript string literal written from JSON is a Python string literal too
    private static String jsString(String text) {
        return jsLiteral(TextNode.valueOf(text));
    }

    /** Returns JSON as a JavaScript literal: JSON is one, except for two line separators. */
    private static String jsLiteral(JsonNode json) {
        try {
            return MAPPER.writeValueAsString(json).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("A JSON value could not be written as JavaScript", e);
        }
    }

    /** Returns the code as the body of a function of the declared parameters. */
    private String functionSource() {
        String names = parameters.stream().map(Parameter::name).collect(Collectors.joining(", "));

        // the code starts on line 2, which the line of a syntax error is corrected for
        return "function " + FUNCTION_NAME + "(" + names + ") {\n" + code + "\n}";
    }

    /**
     * A syntax error of the code.
     *
     * @param line    its line in the code, from 1; {@code null} when it has no single position
     * @param column  its column; {@code null} when it has no single position
     * @param message what is wrong, without the position
     */
    public record SyntaxError(Long line, Long column, String message) {

        /** Returns the error as one text, its position first. */
        public String describe() {
            if (line == null) {
                return message;
            }
            return column == null
                    ? "Line %d: %s".formatted(line, message)
                    : "Line %d, column %d: %s".formatted(line, column, message);
        }
    }

    /**
     * Returns the first syntax error of the code. Only meaningful for a definition whose
     * parameters {@link #check} accepts, since they are part of what is parsed.
     */
    public Optional<SyntaxError> syntaxError() {
        return Optional.ofNullable(parse().error());
    }

    /** The parsed function, or why it does not parse. */
    private record Parsed(CompilationUnitTree unit, SyntaxError error) {
    }

    private Parsed parse() {
        List<Diagnostic> errors = new ArrayList<>();
        CompilationUnitTree unit = Parser.create().parse(FUNCTION_NAME, functionSource(), diagnostic -> {
            if (diagnostic.getKind() == Diagnostic.Kind.ERROR) {
                errors.add(diagnostic);
            }
        });

        if (!errors.isEmpty() || unit == null) {
            return new Parsed(null, toSyntaxError(errors));
        }
        // code such as "return 1; } other(); function x() {" parses, but closes the function
        if (unit.getSourceElements().size() != 1) {
            return new Parsed(null, new SyntaxError(null, null,
                    "The code closes its function early: it has more '}' than '{'"));
        }

        return new Parsed(unit, null);
    }

    private static SyntaxError toSyntaxError(List<Diagnostic> errors) {
        if (errors.isEmpty()) {
            return new SyntaxError(null, null, "The code does not parse");
        }

        Diagnostic first = errors.get(0);
        // the parser's message starts with the source name and the position, given separately here
        String message = Objects.requireNonNullElse(first.getMessage(), "").lines().findFirst().orElse("")
                .replaceFirst("^" + FUNCTION_NAME + ":\\d+:\\d+ ", "");

        // the code starts on line 2 of the function around it
        return new SyntaxError(first.getLineNumber() - 1, first.getColumnNumber(), message);
    }

    /**
     * Finds what saving needs to know about the code: whether the function itself returns a
     * value, and which impure functions it calls. The parameter is the depth of functions: 1 in
     * the body of the script, more inside a function it declares, whose return does not count.
     */
    private static final class ShapeFinder extends SimpleTreeVisitorES5_1<Void, Integer> {

        private boolean returnsValue;
        private final Set<String> impureCalls = new TreeSet<>();

        @Override
        public Void visitFunctionDeclaration(FunctionDeclarationTree node, Integer depth) {
            return super.visitFunctionDeclaration(node, depth + 1);
        }

        @Override
        public Void visitFunctionExpression(FunctionExpressionTree node, Integer depth) {
            return super.visitFunctionExpression(node, depth + 1);
        }

        @Override
        public Void visitReturn(ReturnTree node, Integer depth) {
            if (depth == 1 && node.getExpression() != null) {
                returnsValue = true;
            }
            return super.visitReturn(node, depth);
        }

        @Override
        public Void visitFunctionCall(FunctionCallTree node, Integer depth) {
            if (node.getFunctionSelect() instanceof IdentifierTree called && IMPURE_CALLS.contains(called.getName())) {
                impureCalls.add(called.getName() + "()");
            }
            return super.visitFunctionCall(node, depth);
        }
    }
}
