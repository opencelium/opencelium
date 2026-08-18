package com.becon.opencelium.backend.execution.jump;

/**
 * Stable error codes emitted by {@link JumpValidator}. Returned verbatim to the frontend so it can
 * react per-violation (highlight source/target, guide the user) without parsing message text.
 */
public enum JumpValidationCode {
    /** An operator (IF/LOOP) cannot start a jump. */
    JUMP_SOURCE_IS_OPERATOR,
    /** An operator (IF/LOOP) cannot be a jump target. */
    JUMP_TARGET_IS_OPERATOR,
    /** The target lives inside an operator body the source is not part of. */
    JUMP_TARGET_INSIDE_OPERATOR,
    /** The source is inside a loop and the target is outside that loop. */
    JUMP_ESCAPES_LOOP,
    /** The target does not run strictly after the source. */
    JUMP_BACKWARD,
    /** The target color/index is absent from the connection. */
    JUMP_TARGET_NOT_FOUND,
    /** The source equals the target. */
    JUMP_TO_SELF
}
