package io.opencelium.core.invoker;

import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Optional;

/**
 * An invoker file could not become a valid invoker.
 *
 * <p>It carries every issue found rather than only the first, so an author can fix a file in one
 * pass. {@link #issues()} contains at least one {@link InvokerIssue.Severity#ERROR error}, and may
 * also contain the warnings and notes produced before reading stopped.
 */
public class InvokerReadException extends RuntimeException {

    private final transient @Nullable InvokerFormat format;
    private final transient List<InvokerIssue> issues;

    /**
     * @param format the format the file was recognised as, or {@code null} if reading stopped before that
     * @param issues every issue found; at least one should be an error
     */
    public InvokerReadException(@Nullable InvokerFormat format, List<InvokerIssue> issues) {
        super(summary(issues));
        this.format = format;
        this.issues = List.copyOf(issues);
    }

    /** A failure described by a single issue, before the format was recognised. */
    public InvokerReadException(InvokerIssue issue) {
        this(null, List.of(issue));
    }

    /** The format the file was recognised as, if reading got that far. */
    public Optional<InvokerFormat> format() {
        return Optional.ofNullable(format);
    }

    /** Every issue found, in the order it was found. */
    public List<InvokerIssue> issues() {
        return issues;
    }

    private static String summary(List<InvokerIssue> issues) {
        List<InvokerIssue> errors = issues.stream()
                .filter(issue -> issue.severity() == InvokerIssue.Severity.ERROR)
                .toList();
        if (errors.isEmpty()) {
            return "invoker file could not be read";
        }
        InvokerIssue first = errors.getFirst();
        String more = errors.size() > 1 ? " (and " + (errors.size() - 1) + " more)" : "";
        return first.location() + ": " + first.message() + more;
    }
}
