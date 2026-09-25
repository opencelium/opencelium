package com.becon.opencelium.backend.execution.jump;

/**
 * A single rule violation for a {@code source -> target} jump.
 *
 * <p>Carries both the rendered, actionable {@link #message} (naming source, target and the fix) and
 * the raw identifiers of both elements so the frontend can drive highlighting/navigation rather than
 * parsing the text.
 *
 * @param code        stable machine-readable code
 * @param message     human-readable message naming source, target and remedy
 * @param sourceColor source method color; {@code null} if the source is an operator
 * @param sourceIndex source hierarchical index
 * @param targetColor target method color; {@code null} for an operator or when the target was not found
 * @param targetIndex target hierarchical index; {@code null} when the target was not found
 */
public record JumpViolation(
        JumpValidationCode code,
        String message,
        String sourceColor,
        String sourceIndex,
        String targetColor,
        String targetIndex
) {
}
