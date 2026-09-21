package io.opencelium.core.invoker;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class InvokerReadExceptionTest {

    @Test
    void getMessageSummarisesTheFirstErrorAndCountsTheRest() {
        InvokerReadException failure = new InvokerReadException(InvokerFormat.V6, List.of(
                InvokerIssue.warning("/invoker", "ignored"),
                InvokerIssue.error("/invoker/name", "missing"),
                InvokerIssue.error("/invoker/operations", "empty"),
                InvokerIssue.error("/", "other")));

        assertThat(failure).hasMessage("/invoker/name: missing (and 2 more)");
    }

    @Test
    void getMessageOmitsTheCountWhenThereIsOneError() {
        InvokerReadException failure = new InvokerReadException(InvokerIssue.error("line 2, column 12", "bad"));

        assertThat(failure).hasMessage("line 2, column 12: bad");
    }

    @Test
    void getMessageFallsBackToAGenericTextWhenNoIssueIsAnError() {
        InvokerReadException failure = new InvokerReadException(InvokerFormat.LEGACY_V5,
                List.of(InvokerIssue.info("/", "note")));

        assertThat(failure).hasMessage("invoker file could not be read");
    }

    @Test
    void formatIsEmptyWhenReadingStoppedBeforeTheFormatWasKnown() {
        assertThat(new InvokerReadException(InvokerIssue.error("/", "x")).format()).isEmpty();
        assertThat(new InvokerReadException(InvokerFormat.V6, List.of()).format()).contains(InvokerFormat.V6);
    }
}
