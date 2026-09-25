package com.becon.opencelium.backend.execution.jump;

/**
 * Structural role of a connection executable, as seen by the jump validator.
 *
 * <p>Operators are split into {@link #IF} and {@link #LOOP} because the rules treat them
 * differently: an IF can be escaped outward while a LOOP is a ceiling a method cannot jump out of.
 */
public enum NodeKind {
    /** A regular method — the only kind that may be a jump source or target. */
    METHOD,
    /** An {@code if} operator. */
    IF,
    /** A {@code for} / {@code forin} / {@code splitstring} operator. */
    LOOP;

    public boolean isOperator() {
        return this != METHOD;
    }

    /**
     * Maps an {@code OperatorMng.type} / {@code OperatorEx.type} value to its {@link NodeKind}.
     */
    public static NodeKind ofOperatorType(String type) {
        if (type == null) {
            return LOOP;
        }
        return "if".equalsIgnoreCase(type) ? IF : LOOP;
    }

    /** Human-readable label used in violation messages ({@code "IF"} / {@code "loop"}). */
    public String label() {
        return this == IF ? "IF" : "loop";
    }
}
