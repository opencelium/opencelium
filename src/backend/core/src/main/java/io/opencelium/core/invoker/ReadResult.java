package io.opencelium.core.invoker;

import io.opencelium.common.invoker.Invoker;

import java.util.List;
import java.util.Objects;

/**
 * An invoker read from a file, together with what the reader did to get there.
 *
 * @param format  the format the file was written in
 * @param invoker the invoker; always valid
 * @param issues  notes and warnings about changes made while upgrading an older file; empty for a
 *                file in the current format, and never containing an error
 */
public record ReadResult(InvokerFormat format, Invoker invoker, List<InvokerIssue> issues) {

    public ReadResult {
        Objects.requireNonNull(format, "format must not be null");
        Objects.requireNonNull(invoker, "invoker must not be null");
        issues = List.copyOf(issues);
        if (issues.stream().anyMatch(issue -> issue.severity() == InvokerIssue.Severity.ERROR)) {
            throw new IllegalArgumentException("a successful read cannot carry an error; throw InvokerReadException");
        }
    }

    /** Whether the file was in an older format and had to be converted. */
    public boolean upgraded() {
        return format != InvokerFormat.V6;
    }
}
