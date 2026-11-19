package com.becon.opencelium.backend.exception;

import java.util.List;

/**
 * Thrown when a workflow, a connector or a notification being saved holds global variable
 * references that cannot be used there. Carries one violation per reference, each naming the
 * element, the field and the variable, so the API can answer 400 with a per-reference payload
 * and the editor can show each message where the reference is written.
 */
public class GlobalReferenceValidationException extends RuntimeException {

    /** Why a reference was rejected. */
    public enum Code {
        /** No variable has this name. */
        UNKNOWN_VARIABLE,
        /** The workflow, or the workflow a notification belongs to, is outside the scope of the variable. */
        OUT_OF_SCOPE,
        /** A connector references a variable that is not open to all workflows. */
        SCOPE_NOT_ALL,
        /** The saving user holds no VIEW_USE permission on the variable. */
        NO_USE_PERMISSION
    }

    /**
     * One rejected reference.
     *
     * @param code     why it was rejected
     * @param message  text for the user
     * @param variable name of the referenced variable
     * @param ref      the reference as written
     * @param color    color of the method that holds it, {@code null} for an operator and
     *                 outside a workflow
     * @param index    index path of the element that holds it, {@code null} outside a workflow
     * @param field    where it stands: in a workflow element e.g. {@code body.filter.since}, in
     *                 a connector the name of the request data field, in a notification the text
     *                 of the template, e.g. {@code en.body}
     */
    public record Violation(Code code, String message, String variable, String ref,
                            String color, String index, String field) {
    }

    private final transient List<Violation> violations;

    public GlobalReferenceValidationException(List<Violation> violations) {
        super(violations.isEmpty() ? "Invalid global variable reference." : violations.get(0).message());
        this.violations = List.copyOf(violations);
    }

    public List<Violation> getViolations() {
        return violations;
    }
}
