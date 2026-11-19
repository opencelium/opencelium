package com.becon.opencelium.backend.resource.error;

import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * Error payload of the global variable endpoints: the fields of {@link ErrorResource} plus what
 * the form needs to react.
 *
 * <p>A 400 carries {@code violations}, one per rejected request field. A 409 carries the
 * conflict {@code code}, the {@code currentVersion} of the variable and {@code blocking}, the
 * usages that stand in the way of the change.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GlobalVariableErrorResource {

    public static final String INVALID = "GLOBAL_VARIABLE_INVALID";
    public static final String CONFLICT = "GLOBAL_VARIABLE_CONFLICT";

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private final Instant timestamp = Instant.now();
    private final int status;
    private final String error;
    private final String code;
    private final String message;
    private final String path;
    private final Long currentVersion;
    private final List<Violation> violations;
    private final List<GlobalVariableConflictException.Blocking> blocking;

    private GlobalVariableErrorResource(HttpStatus status, String error, String code, String message,
            String path, Long currentVersion, List<Violation> violations,
            List<GlobalVariableConflictException.Blocking> blocking) {
        this.status = status.value();
        this.error = error;
        this.code = code;
        this.message = message;
        this.path = path;
        this.currentVersion = currentVersion;
        this.violations = violations;
        this.blocking = blocking;
    }

    public static GlobalVariableErrorResource of(GlobalVariableValidationException e, String path) {
        List<Violation> violations = e.getViolations().stream()
                .map(v -> new Violation(v.field(), v.code().name(), v.message()))
                .toList();

        return new GlobalVariableErrorResource(
                HttpStatus.BAD_REQUEST, INVALID, null, e.getMessage(), path, null, violations, null);
    }

    public static GlobalVariableErrorResource of(GlobalVariableConflictException e, String path) {
        return new GlobalVariableErrorResource(
                HttpStatus.CONFLICT, CONFLICT, e.getCode().name(), e.getMessage(), path,
                e.getCurrentVersion(), null, e.getBlocking());
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public Long getCurrentVersion() {
        return currentVersion;
    }

    public List<Violation> getViolations() {
        return violations;
    }

    public List<GlobalVariableConflictException.Blocking> getBlocking() {
        return blocking;
    }

    /** One rejected request field. */
    public record Violation(String field, String code, String message) {
    }
}
