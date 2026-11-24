package com.becon.opencelium.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Objects;

/**
 * Thrown when a change of a global variable cannot be saved because of the state the variable is
 * in, which the API answers with 409.
 */
public class GlobalVariableConflictException extends RuntimeException {

    /** Why the change conflicts. */
    public enum Code {
        /** Someone changed the variable after the form loaded it: reload and retry. */
        VERSION_CONFLICT,
        /** The variable is used, so it cannot be deleted or renamed. */
        IN_USE,
        /** The new scope would leave out a workflow that uses the variable. */
        SCOPE_NARROWING,
        /** The new parameters of a used script variable would break the calls made to it. */
        PARAMETER_BREAKING,
        /**
         * A workflow that uses the variable is already running and cannot start again now: the
         * variable's busy policy is Refuse, or the queue of the workflow is full.
         */
        BUSY
    }

    /**
     * One usage that stands in the way of the change.
     *
     * @param sourceType   WORKFLOW, CONNECTOR or NOTIFICATION
     * @param sourceId     id of the source
     * @param sourceTitle  title of the source, {@code null} if it no longer exists
     * @param elementType  kind of the workflow element that holds the reference, {@code null}
     *                     for a connector and a notification
     * @param elementLabel what the editor calls the element; for a notification the name of its
     *                     template
     * @param color        color of the element if it is a method
     * @param index        index path of the element, {@code null} outside a workflow
     * @param field        where the reference stands: in an element, or the request data field
     *                     of a connector, or the text of a notification template
     * @param reason       why this usage blocks: IN_USE, OUT_OF_SCOPE for a SCOPE_NARROWING
     *                     conflict, or PARAMETER_BREAKING; CALLS_IN_CODE_NOT_CHECKED for a
     *                     warning of the impact preview
     * @param parameter    for {@code PARAMETER_BREAKING}, the script parameter whose change breaks
     *                     the calls; otherwise {@code null} and left out of the JSON
     */
    public record Blocking(String sourceType, Long sourceId, String sourceTitle, String elementType,
                           String elementLabel, String color, String index, String field, String reason,
                           @JsonInclude(JsonInclude.Include.NON_NULL) String parameter) {

        /** A usage that blocks for a reason about no parameter. */
        public Blocking(String sourceType, Long sourceId, String sourceTitle, String elementType,
                String elementLabel, String color, String index, String field, String reason) {
            this(sourceType, sourceId, sourceTitle, elementType, elementLabel, color, index, field, reason, null);
        }
    }

    private final Code code;
    private final long currentVersion;
    private final transient List<Blocking> blocking;

    public GlobalVariableConflictException(Code code, String message, long currentVersion) {
        this(code, message, currentVersion, List.of());
    }

    public GlobalVariableConflictException(Code code, String message, long currentVersion, List<Blocking> blocking) {
        super(message);
        this.code = Objects.requireNonNull(code, "code");
        this.currentVersion = currentVersion;
        this.blocking = List.copyOf(blocking);
    }

    public Code getCode() {
        return code;
    }

    /** The version the variable has now. */
    public long getCurrentVersion() {
        return currentVersion;
    }

    /** The usages that block the change; empty for a version conflict. */
    public List<Blocking> getBlocking() {
        return blocking;
    }
}
