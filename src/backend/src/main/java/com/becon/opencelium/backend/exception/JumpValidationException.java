package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.execution.jump.JumpViolation;

import java.util.List;

/**
 * Thrown when a connection being saved contains one or more invalid jumps. Carries the full list of
 * {@link JumpViolation}s so the API can return a per-violation payload (code + message + source/target
 * ids) and the frontend can highlight both elements.
 */
public class JumpValidationException extends RuntimeException {

    private final transient List<JumpViolation> violations;

    public JumpValidationException(List<JumpViolation> violations) {
        super(buildMessage(violations));
        this.violations = List.copyOf(violations);
    }

    public List<JumpViolation> getViolations() {
        return violations;
    }

    private static String buildMessage(List<JumpViolation> violations) {
        if (violations == null || violations.isEmpty()) {
            return "Invalid jump configuration.";
        }
        return violations.get(0).message();
    }
}
