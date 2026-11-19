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
        KIND_NOT_SUPPORTED,
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
        NOT_RESTORABLE
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
