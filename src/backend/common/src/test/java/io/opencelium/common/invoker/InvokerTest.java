package io.opencelium.common.invoker;

import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class InvokerTest {

    private static Operation operation(String id) {
        return new Operation(id, id, null, Set.of(), Request.of("GET", "{url}/" + id),
                List.of(Response.of(ResponseStatus.DEFAULT)), null);
    }

    private static Invoker invoker(Operation... operations) {
        return new Invoker("demo", "Demo", null, null, null, null, Set.of(), List.of(), List.of(operations));
    }

    @Test
    void operationReturnsTheOperationWithThatId() {
        Invoker invoker = invoker(operation("login"), operation("listTickets"));

        assertThat(invoker.operation("listTickets")).map(Operation::id).contains("listTickets");
    }

    @Test
    void operationReturnsEmptyWhenIdDiffersOnlyInCase() {
        Invoker invoker = invoker(operation("login"));

        assertThat(invoker.operation("Login")).isEmpty();
    }
}
