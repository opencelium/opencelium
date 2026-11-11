package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionRequest;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ErrorType;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO.ScriptExecutionErrorDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO.ScriptErrorDTO;
import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.script.ScriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Runs enhancement scripts with test values in a sandboxed Nashorn engine.
 *
 * <p>The script is first checked by {@link ScriptValidationService}, so syntax errors carry the
 * same hints as {@code /lang-code/validate}. It then runs on its own thread: at most {@code
 * maxConcurrentRuns} scripts run at once, and a script still running after {@code timeout} is
 * stopped. Nashorn cannot be interrupted, so the thread is stopped with {@link Thread#stop()},
 * which works on Java 17-19; on later JVMs the thread keeps running and holds its run slot until
 * it ends.
 */
@Service
public class ScriptRunServiceImpl implements ScriptRunService {

  private static final Logger LOGGER = LoggerFactory.getLogger(ScriptRunServiceImpl.class);

  /** The binding real executions assign the result to; they never inject it as a variable. */
  private static final String RESULT_VARIABLE = "RESULT_VAR";

  private static final int MAX_VARIABLES_BYTES = 1_000_000;
  private static final int MAX_OUTPUT_LENGTH = 65_536;

  private static final Pattern IDENTIFIER = Pattern.compile("^[A-Za-z_$][A-Za-z0-9_$]*$");
  private static final Set<String> RESERVED_WORDS =
      Set.of(
          "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
          "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if",
          "implements", "import", "in", "instanceof", "interface", "let", "new", "null",
          "package", "private", "protected", "public", "return", "static", "super", "switch",
          "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield",
          "undefined", "NaN", "Infinity", "eval", "arguments");

  private static final Pattern ENGINE_SUFFIX = Pattern.compile("\\s+in \\S+ at line number.*$");
  private static final Pattern ERROR_NAME = Pattern.compile("^((?:[A-Z][A-Za-z]*)?Error): (.*)$");
  private static final Pattern NOT_DEFINED = Pattern.compile("^\"(.+)\" is not defined$");
  private static final Pattern PROPERTY_OF_EMPTY =
      Pattern.compile("^Cannot (?:read|get|set) property \"(.+)\" (?:from|of|on) (undefined|null)$");
  private static final Pattern NOT_A_FUNCTION = Pattern.compile("^(.+) is not a function$");
  private static final Pattern LINE_BREAK = Pattern.compile("\\R");

  private static final String TIMEOUT_HINT =
      "The script ran too long. Look for a loop that never ends, e.g. a while condition that"
          + " never becomes false or a loop counter that is not increased.";
  private static final String GENERIC_RUNTIME_HINT =
      "The script failed while running. Check the reported line and the values of the"
          + " variables it uses.";
  private static final String RESULT_HINT =
      "End the script with a string, number, boolean, null, plain object or array. Functions,"
          + " dates and other special objects cannot be returned; convert them first, e.g."
          + " date.toISOString().";

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final AtomicLong RUN_COUNTER = new AtomicLong();

  private final ScriptValidationService scriptValidationService;
  private final NashornEngine nashornEngine;
  private final Duration timeout;
  private final Semaphore runSlots;

  public ScriptRunServiceImpl(
      ScriptValidationService scriptValidationService,
      NashornEngine nashornEngine,
      @Value("${opencelium.script-run.timeout:5s}") Duration timeout,
      @Value("${opencelium.script-run.max-concurrent:2}") int maxConcurrentRuns) {
    this.scriptValidationService = scriptValidationService;
    this.nashornEngine = nashornEngine;
    this.timeout = timeout;
    this.runSlots = new Semaphore(maxConcurrentRuns);
  }

  @Override
  public ScriptExecutionResultDTO run(ScriptExecutionRequest request) {
    ScriptExecutionRequest safeRequest =
        request == null ? new ScriptExecutionRequest(null, null, null) : request;

    ScriptValidationResultDTO validation =
        scriptValidationService.validate(
            new ScriptValidationRequest(safeRequest.language(), safeRequest.script()));
    Map<String, Object> bindings = toBindings(safeRequest.variables());

    if (!validation.valid()) {
      return ScriptExecutionResultDTO.failure(
          validation.language(), "", 0, syntaxError(validation.errors().get(0)));
    }
    return execute(validation.language(), safeRequest.script(), bindings);
  }

  private ScriptExecutionResultDTO execute(
      String language, String script, Map<String, Object> bindings) {
    if (!runSlots.tryAcquire()) {
      throw new GeneralServiceException(
          HttpStatus.TOO_MANY_REQUESTS,
          "TOO_MANY_SCRIPT_RUNS",
          "Too many scripts are running; try again in a moment");
    }

    BoundedWriter output = new BoundedWriter(MAX_OUTPUT_LENGTH);
    FutureTask<Object> task =
        new FutureTask<>(
            () -> {
              try {
                return nashornEngine.executeSandboxed(script, bindings, output);
              } finally {
                runSlots.release();
              }
            });
    Thread runner = new Thread(task, "script-run-" + RUN_COUNTER.incrementAndGet());
    runner.setDaemon(true);

    long start = System.nanoTime();
    try {
      runner.start();
    } catch (Throwable t) {
      runSlots.release();
      throw t;
    }

    try {
      Object result = task.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
      return ScriptExecutionResultDTO.success(
          language, result, typeOf(result), output.text(), elapsedMillis(start));
    } catch (TimeoutException e) {
      stop(runner);
      return ScriptExecutionResultDTO.failure(
          language, output.text(), elapsedMillis(start), timeoutError());
    } catch (ExecutionException e) {
      return ScriptExecutionResultDTO.failure(
          language, output.text(), elapsedMillis(start), toError(e.getCause(), script));
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      stop(runner);
      throw new GeneralServiceException(
          HttpStatus.SERVICE_UNAVAILABLE, "SCRIPT_RUN_INTERRUPTED", "The script run was interrupted");
    }
  }

  private static Map<String, Object> toBindings(Map<String, Object> variables) {
    if (serializedSize(variables) > MAX_VARIABLES_BYTES) {
      throw new GeneralServiceException(
          "VARIABLES_TOO_LARGE",
          "Variables must not be larger than %d bytes as JSON".formatted(MAX_VARIABLES_BYTES));
    }

    Map<String, Object> bindings = new LinkedHashMap<>();
    variables.forEach(
        (name, value) -> {
          if (RESULT_VARIABLE.equals(name)) {
            return;
          }
          if (name == null || !IDENTIFIER.matcher(name).matches() || RESERVED_WORDS.contains(name)) {
            throw new GeneralServiceException(
                "INVALID_VARIABLE_NAME",
                "'%s' is not a valid JavaScript variable name".formatted(name));
          }
          bindings.put(name, normalizeNumber(value));
        });
    return bindings;
  }

  private static int serializedSize(Map<String, Object> variables) {
    try {
      return MAPPER.writeValueAsBytes(variables).length;
    } catch (JsonProcessingException e) {
      throw new UncheckedIOException(e);
    }
  }

  /**
   * Nashorn treats {@code Long}, {@code BigInteger} and {@code BigDecimal} as objects, not
   * numbers; nested values are converted through JSON and need no conversion.
   */
  private static Object normalizeNumber(Object value) {
    if (!(value instanceof Number number) || value instanceof Integer || value instanceof Double) {
      return value;
    }
    double asDouble = number.doubleValue();
    boolean fitsInt =
        asDouble == Math.rint(asDouble)
            && asDouble >= Integer.MIN_VALUE
            && asDouble <= Integer.MAX_VALUE;
    return fitsInt ? Integer.valueOf((int) asDouble) : Double.valueOf(asDouble);
  }

  @SuppressWarnings({"deprecation", "removal"})
  private static void stop(Thread runner) {
    runner.interrupt();
    try {
      runner.stop();
    } catch (UnsupportedOperationException e) {
      LOGGER.warn(
          "Cannot stop script thread {} on this JVM; it holds a run slot until the script ends",
          runner.getName());
    }
  }

  private static long elapsedMillis(long startNanos) {
    return Duration.ofNanos(System.nanoTime() - startNanos).toMillis();
  }

  private static String typeOf(Object result) {
    if (result == null) {
      return "null";
    }
    if (result instanceof String) {
      return "string";
    }
    if (result instanceof Number) {
      return "number";
    }
    if (result instanceof Boolean) {
      return "boolean";
    }
    return result instanceof List ? "array" : "object";
  }

  private static ScriptExecutionErrorDTO syntaxError(ScriptErrorDTO error) {
    return new ScriptExecutionErrorDTO(
        ErrorType.SYNTAX,
        "SyntaxError",
        error.line(),
        error.column(),
        error.message(),
        error.codeLine(),
        error.hint());
  }

  private ScriptExecutionErrorDTO timeoutError() {
    return new ScriptExecutionErrorDTO(
        ErrorType.TIMEOUT,
        null,
        null,
        null,
        "Script did not finish within %d ms".formatted(timeout.toMillis()),
        null,
        TIMEOUT_HINT);
  }

  private static ScriptExecutionErrorDTO toError(Throwable failure, String script) {
    if (failure instanceof ScriptExecutionException
        && failure.getCause() instanceof ScriptException cause) {
      return runtimeError(cause, script);
    }
    if (failure instanceof ScriptExecutionException) {
      return new ScriptExecutionErrorDTO(
          ErrorType.RESULT, null, null, null, failure.getMessage(), null, RESULT_HINT);
    }
    return new ScriptExecutionErrorDTO(
        ErrorType.RUNTIME,
        null,
        null,
        null,
        String.valueOf(failure.getMessage()),
        null,
        GENERIC_RUNTIME_HINT);
  }

  private static ScriptExecutionErrorDTO runtimeError(ScriptException cause, String script) {
    String raw = cause.getMessage() == null ? "" : cause.getMessage();
    int lineBreak = raw.indexOf('\n');
    String firstLine = lineBreak >= 0 ? raw.substring(0, lineBreak) : raw;
    String text = ENGINE_SUFFIX.matcher(firstLine).replaceFirst("").trim();

    Matcher named = ERROR_NAME.matcher(text);
    String name = named.matches() ? named.group(1) : null;
    String message = named.matches() ? named.group(2) : text;

    Integer line = cause.getLineNumber() > 0 ? cause.getLineNumber() : null;
    // Nashorn columns are 0-based and usually missing (-1) for runtime errors.
    Integer column = cause.getColumnNumber() >= 0 ? cause.getColumnNumber() + 1 : null;
    String codeLine = line == null ? null : lineAt(script, line).orElse(null);
    return new ScriptExecutionErrorDTO(
        ErrorType.RUNTIME, name, line, column, message, codeLine, runtimeHint(name, message));
  }

  private static Optional<String> lineAt(String script, int line) {
    String[] lines = LINE_BREAK.split(script, -1);
    return line <= lines.length ? Optional.of(lines[line - 1]) : Optional.empty();
  }

  private static String runtimeHint(String name, String message) {
    Matcher notDefined = NOT_DEFINED.matcher(message);
    if (notDefined.matches()) {
      return ("'%s' is not defined: it is neither declared in the script nor one of the provided"
              + " variables. Add a value for it to the variables, declare it with var, or check"
              + " the spelling.")
          .formatted(notDefined.group(1));
    }
    Matcher ofEmpty = PROPERTY_OF_EMPTY.matcher(message);
    if (ofEmpty.matches()) {
      return ("The value whose '%s' is accessed is %s. Check that the variable holds the expected"
              + " data and that the path is spelled correctly, or guard it, e.g."
              + " if (value) { ... }.")
          .formatted(ofEmpty.group(1), ofEmpty.group(2));
    }
    Matcher notAFunction = NOT_A_FUNCTION.matcher(message);
    if (notAFunction.matches()) {
      return ("%s is not a function. Check the spelling, and that the method exists in JavaScript"
              + " ES5.1: newer methods such as includes, startsWith or find are not available"
              + " (use indexOf(...) !== -1 or a loop).")
          .formatted(notAFunction.group(1));
    }
    if ("SyntaxError".equals(name) && message.startsWith("Invalid JSON")) {
      return "JSON.parse got text that is not valid JSON. Variables with object or array values"
          + " are already parsed: use them directly instead of passing them to JSON.parse.";
    }
    if ("RangeError".equals(name)) {
      return "A value is out of its allowed range, e.g. a negative array length. Check the"
          + " numbers used at the reported line.";
    }
    if ("URIError".equals(name)) {
      return "A URI function got malformed input. Check the text passed to decodeURIComponent"
          + " or encodeURIComponent.";
    }
    if (name == null || "Error".equals(name)) {
      return "The script threw this error itself (throw ...). Check the condition that leads"
          + " to it.";
    }
    return GENERIC_RUNTIME_HINT;
  }

  /** Collects {@code print} output up to a limit, so a chatty loop cannot exhaust memory. */
  private static final class BoundedWriter extends Writer {

    private final int limit;
    private final StringBuilder text = new StringBuilder();
    private boolean truncated;

    private BoundedWriter(int limit) {
      this.limit = limit;
    }

    @Override
    public synchronized void write(char[] buffer, int offset, int length) {
      int room = limit - text.length();
      if (length > room) {
        truncated = true;
      }
      if (room > 0) {
        text.append(buffer, offset, Math.min(length, room));
      }
    }

    @Override
    public void flush() {}

    @Override
    public void close() {}

    private synchronized String text() {
      return truncated
          ? text + "\n[output truncated at %d characters]".formatted(limit)
          : text.toString();
    }
  }
}
