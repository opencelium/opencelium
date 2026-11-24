package com.becon.opencelium.backend.resource.error;

import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * 400 payload returned when the save of a workflow, a connector, a notification or a
 * notification template is rejected because of its global variable references. Exposes each
 * violation's code and message with the element, the field and the variable it concerns, so the
 * editor can show the message where the reference is written.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GlobalReferenceErrorResource {

    public static final String ERROR = "GLOBAL_REFERENCE_INVALID";

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private final Instant timestamp = Instant.now();
    private final int status = HttpStatus.BAD_REQUEST.value();
    private final String error = ERROR;
    private final String message;
    private final String path;
    private final List<Violation> violations;

    public GlobalReferenceErrorResource(GlobalReferenceValidationException e, String path) {
        this.message = e.getMessage();
        this.path = path;
        this.violations = e.getViolations().stream()
                .map(v -> new Violation(
                        v.code().name(), v.message(), v.variable(), v.ref(), v.color(), v.index(), v.field()))
                .toList();
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

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public List<Violation> getViolations() {
        return violations;
    }

    /**
     * One rejected reference. {@code color} is left out for an operator; a connector and a
     * notification carry only {@code field}, without {@code color} and {@code index}.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Violation(String code, String message, String variable, String ref,
                            String color, String index, String field) {
    }
}
