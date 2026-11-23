package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import org.openjdk.nashorn.api.tree.CompilationUnitTree;
import org.openjdk.nashorn.api.tree.Diagnostic;
import org.openjdk.nashorn.api.tree.FunctionCallTree;
import org.openjdk.nashorn.api.tree.FunctionDeclarationTree;
import org.openjdk.nashorn.api.tree.FunctionExpressionTree;
import org.openjdk.nashorn.api.tree.IdentifierTree;
import org.openjdk.nashorn.api.tree.Parser;
import org.openjdk.nashorn.api.tree.ReturnTree;
import org.openjdk.nashorn.api.tree.SimpleTreeVisitorES5_1;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
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
        List<Diagnostic> errors = new ArrayList<>();
        CompilationUnitTree unit = Parser.create().parse(FUNCTION_NAME, functionSource(), diagnostic -> {
            if (diagnostic.getKind() == Diagnostic.Kind.ERROR) {
                errors.add(diagnostic);
            }
        });

        if (!errors.isEmpty() || unit == null) {
            violations.add(new Violation("script.code", Code.SCRIPT_SYNTAX, syntaxMessage(errors)));
            return;
        }
        // code such as "return 1; } other(); function x() {" parses, but closes the function
        if (unit.getSourceElements().size() != 1) {
            violations.add(new Violation("script.code", Code.SCRIPT_SYNTAX,
                    "The code closes its function early: it has more '}' than '{'"));
            return;
        }

        ShapeFinder shape = new ShapeFinder();
        unit.getSourceElements().get(0).accept(shape, 0);
        if (!shape.impureCalls.isEmpty()) {
            violations.add(new Violation("script.code", Code.SCRIPT_NOT_PURE,
                    "A script uses only its parameters, so it cannot call " + String.join(" or ", shape.impureCalls)));
        }
        if (!shape.returnsValue) {
            violations.add(new Violation("script.code", Code.NO_RETURN_VALUE,
                    "The script must return a value with 'return <value>;'"));
        }
    }

    /** Returns the code as the body of a function of the declared parameters. */
    private String functionSource() {
        String names = parameters.stream().map(Parameter::name).collect(Collectors.joining(", "));

        // the code starts on line 2, which the line of a syntax error is corrected for
        return "function " + FUNCTION_NAME + "(" + names + ") {\n" + code + "\n}";
    }

    private static String syntaxMessage(List<Diagnostic> errors) {
        if (errors.isEmpty()) {
            return "The code does not parse";
        }

        Diagnostic first = errors.get(0);
        // the parser's message starts with the source name and the position, given separately here
        String message = Objects.requireNonNullElse(first.getMessage(), "").lines().findFirst().orElse("")
                .replaceFirst("^" + FUNCTION_NAME + ":\\d+:\\d+ ", "");

        return "Line %d, column %d: %s".formatted(first.getLineNumber() - 1, first.getColumnNumber(), message);
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
