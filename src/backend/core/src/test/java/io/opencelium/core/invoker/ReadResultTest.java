package io.opencelium.core.invoker;

import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReadResultTest {

    private static final Invoker INVOKER = new Invoker("demo", "Demo", null, null, null, null, Set.of(), List.of(),
            List.of(new Operation("list", "list", null, Set.of(), Request.of("GET", "{url}"),
                    List.of(Response.of(ResponseStatus.DEFAULT)), null)));

    @Test
    void upgradedReturnsFalseWhenFileIsInTheCurrentFormat() {
        assertThat(new ReadResult(InvokerFormat.V6, INVOKER, List.of()).upgraded()).isFalse();
    }

    @Test
    void upgradedReturnsTrueWhenFileIsLegacy() {
        assertThat(new ReadResult(InvokerFormat.LEGACY_V5, INVOKER, List.of()).upgraded()).isTrue();
    }

    @Test
    void constructorThrowsWhenAnIssueIsAnError() {
        List<InvokerIssue> issues = List.of(InvokerIssue.error("/", "broken"));

        assertThatThrownBy(() -> new ReadResult(InvokerFormat.LEGACY_V5, INVOKER, issues))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a successful read cannot carry an error; throw InvokerReadException");
    }
}
