package com.becon.opencelium.backend.resource.error;

import com.becon.opencelium.backend.execution.jump.JumpViolation;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.util.Date;
import java.util.List;

/**
 * 400 payload returned when a connection save is rejected because of invalid jumps. Exposes each
 * violation's code, message and raw source/target ids so the frontend can highlight both elements.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JumpValidationErrorResource {

    private final Date timestamp = new Date();
    private final int status = HttpStatus.BAD_REQUEST.value();
    private final String error = "JUMP_VALIDATION_FAILED";
    private final String message;
    private final List<Violation> violations;

    public JumpValidationErrorResource(List<JumpViolation> violations) {
        this.violations = violations.stream().map(Violation::new).toList();
        this.message = violations.isEmpty() ? "Invalid jump configuration." : violations.get(0).message();
    }

    public Date getTimestamp() {
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

    public List<Violation> getViolations() {
        return violations;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Violation {
        private final String code;
        private final String message;
        private final String sourceColor;
        private final String sourceIndex;
        private final String targetColor;
        private final String targetIndex;

        Violation(JumpViolation v) {
            this.code = v.code().name();
            this.message = v.message();
            this.sourceColor = v.sourceColor();
            this.sourceIndex = v.sourceIndex();
            this.targetColor = v.targetColor();
            this.targetIndex = v.targetIndex();
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public String getSourceColor() {
            return sourceColor;
        }

        public String getSourceIndex() {
            return sourceIndex;
        }

        public String getTargetColor() {
            return targetColor;
        }

        public String getTargetIndex() {
            return targetIndex;
        }
    }
}
