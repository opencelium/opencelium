package com.becon.opencelium.backend.exception;

import java.util.List;

/**
 * Thrown when a global variable request is rejected because of its content. Carries every
 * violation found, each with the request field it belongs to, so the API can answer 400 with a
 * per-field payload and the form can show each message on its field.
 */
public class GlobalVariableValidationException extends RuntimeException {

    /** Why a field was rejected. */
    public enum Code {
        NAME_INVALID,
        NAME_TAKEN,
        KIND_REQUIRED,
        KIND_CHANGE_NOT_ALLOWED,
        DESCRIPTION_TOO_LONG,
        VALUE_TOO_LARGE,
        // a secret is made visible again only with a new value: its hidden one is never shown
        SECRET_REMOVAL_NEEDS_VALUE,
        SCOPE_REQUIRED,
        SCOPE_INVALID,
        VERSION_REQUIRED,
        GRANT_INVALID,
        IDS_REQUIRED,
        TOO_MANY_IDS,
        SCRIPT_HAS_NO_VALUE,
        PICKER_TARGET_AMBIGUOUS,
        NOT_RESTORABLE,
        // a mutable variable names the workflow whose runs may write it
        OWNER_WORKFLOW_REQUIRED,
        // the owner workflow does not exist or is outside the scope of the variable
        OWNER_WORKFLOW_INVALID,
        // a field that only a mutable variable has was given for another kind
        MUTABLE_ONLY,
        // runs write a mutable variable, so it cannot be a secret
        SECRET_NOT_ALLOWED,
        // only a mutable variable has a current value to reset
        NOT_MUTABLE,
        // a script variable is saved with its script: language, code and parameters
        SCRIPT_REQUIRED,
        // a script was given for a variable that is not a script
        SCRIPT_ONLY,
        // the script is written in a language script variables do not support yet
        LANGUAGE_NOT_SUPPORTED,
        // the language of a script variable never changes
        LANGUAGE_CHANGE_NOT_ALLOWED,
        // the code does not parse as the body of a function
        SCRIPT_SYNTAX,
        // the code has no 'return' with a value
        NO_RETURN_VALUE,
        // the code calls ref() or set(), which a script, using only its parameters, does not
        SCRIPT_NOT_PURE,
        // a parameter name is not an identifier, is reserved or is declared twice
        PARAMETER_INVALID
    }

    /**
     * One rejected field.
     *
     * @param field   the request field, e.g. {@code name} or {@code scope}
     * @param code    why it was rejected
     * @param message text for the user
     */
    public record Violation(String field, Code code, String message) {
    }

    private final transient List<Violation> violations;

    public GlobalVariableValidationException(List<Violation> violations) {
        super(violations.isEmpty() ? "Invalid global variable." : violations.get(0).message());
        this.violations = List.copyOf(violations);
    }

    public List<Violation> getViolations() {
        return violations;
    }
}
