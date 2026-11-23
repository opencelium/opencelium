package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
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

/**
 * The definition of a script variable: a function body in a language, with declared parameters.
 *
 * <p>An enhancement imports the script as one of its args, {@code //var VAR_1 =
 * {{global.formatDate}};}, and its code calls it as a function, {@code VAR_1(VAR_0, 'dd.MM')}.
 * The script is meant as a pure function: it uses only its parameters, so its code may not call
 * {@code ref()} or {@code set()}, which reach the workflow and its variables.
 *
 * <p>The definition is stored as JSON in the {@code value} column of the variable, the form
 * {@link #toJson} writes, so the change log and restore treat a script like any value.
 *
 * @param language   code of the language, as {@link LanguageType} names it; only {@code js}
 *                   for now
 * @param code       the body of the function, which returns the result
 * @param parameters the declared parameters, in the order a call passes them
 */
public record GlobalScript(String language, String code, List<Parameter> parameters) {

    /** How long an enhancement that imports a script may run, unless configured otherwise. */
    public static final Duration DEFAULT_TIME_LIMIT = Duration.ofSeconds(5);

    private static final Logger log = LoggerFactory.getLogger(GlobalScript.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String FUNCTION_NAME = "OC_SCRIPT";
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
     * parameters, and code that parses as the body of the function, returns a value and calls
     * neither {@code ref()} nor {@code set()}.
     *
     * @return what is wrong, each on its request field ({@code script.code}, {@code
     *         script.parameters[1].name}, ...); empty when the definition can be saved
     */
    public List<Violation> check() {
        List<Violation> violations = new ArrayList<>();

        if (!LanguageType.JS.getCode().equals(language)) {
            violations.add(new Violation("script.language", Code.LANGUAGE_NOT_SUPPORTED,
                    "Script variables are written in JavaScript (js) for now, not in '%s'".formatted(language)));
        }
        boolean parametersValid = checkParameters(violations);
        if (code == null || code.isBlank()) {
            violations.add(new Violation("script.code", Code.SCRIPT_REQUIRED, "The code of the script is required"));
        } else if (parametersValid && violations.isEmpty()) {
            // the code is parsed only once the function around it can be built
            checkCode(violations);
        }

        return violations;
    }

    private boolean checkParameters(List<Violation> violations) {
        int before = violations.size();
        Set<String> seen = new HashSet<>();

        for (int i = 0; i < parameters.size(); i++) {
            Parameter parameter = parameters.get(i);
            String field = "script.parameters[" + i + "]";

            if (parameter == null || parameter.name() == null || !IDENTIFIER.matcher(parameter.name()).matches()) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID,
                        "A parameter name has letters, digits, '_' or '$' and does not start with a digit"));
            } else if (RESERVED.contains(parameter.name())) {
                violations.add(new Violation(field + ".name", Code.PARAMETER_INVALID,
                        "'%s' is a reserved word in JavaScript".formatted(parameter.name())));
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
     * Returns JavaScript that defines {@code variable} as a function an enhancement calls: {@code
     * var VAR_1 = ...;}. The function takes the declared parameters in order and extra arguments
     * after them. It fails when a required parameter is missing, fills in the default of an
     * optional one that is left out or {@code undefined}, names the script in an error the code
     * throws, and fails when the code returns {@code undefined}. The code sees its parameters and
     * {@code arguments}; nothing keeps it from reading the enhancement's globals, which is
     * documented, not enforced.
     *
     * @param variable   name of the enhancement arg that imports the script, e.g. {@code VAR_1}
     * @param scriptName name of the script variable, for the errors
     * @throws IllegalArgumentException if {@code variable} is not a JavaScript identifier
     */
    public String functionSource(String variable, String scriptName) {
        if (variable == null || !IDENTIFIER.matcher(variable).matches() || RESERVED.contains(variable)) {
            throw new IllegalArgumentException("'%s' cannot name an imported script".formatted(variable));
        }
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
            return line == null ? message : "Line %d, column %d: %s".formatted(line, column, message);
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
