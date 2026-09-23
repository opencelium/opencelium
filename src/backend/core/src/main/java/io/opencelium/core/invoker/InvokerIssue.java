package io.opencelium.core.invoker;

import java.util.Objects;

/**
 * Something worth telling the author of an invoker file: a problem that blocks it, or a change made
 * to it while it was read.
 *
 * @param severity how much attention it needs
 * @param location where in the file it applies: an element path such as
 *                 {@code /invoker/operations/operation[@name='login']/request}, a line and column when
 *                 the file could not be parsed at all, or {@code /} for the file as a whole
 * @param message  what happened, written for the person who maintains the file
 */
public record InvokerIssue(Severity severity, String location, String message) {

    public enum Severity {

        /** Changed automatically; nothing to do. */
        INFO,

        /** Changed or dropped automatically, but the result should be reviewed. */
        WARNING,

        /** Prevents the invoker from being read or imported. */
        ERROR
    }

    public InvokerIssue {
        Objects.requireNonNull(severity, "issue severity must not be null");
        Objects.requireNonNull(location, "issue location must not be null");
        Objects.requireNonNull(message, "issue message must not be null");
    }

    public static InvokerIssue info(String location, String message) {
        return new InvokerIssue(Severity.INFO, location, message);
    }

    public static InvokerIssue warning(String location, String message) {
        return new InvokerIssue(Severity.WARNING, location, message);
    }

    public static InvokerIssue error(String location, String message) {
        return new InvokerIssue(Severity.ERROR, location, message);
    }

    @Override
    public String toString() {
        return severity + " " + location + ": " + message;
    }
}
