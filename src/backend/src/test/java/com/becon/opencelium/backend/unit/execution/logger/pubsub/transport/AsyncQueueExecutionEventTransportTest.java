package com.becon.opencelium.backend.unit.execution.logger.pubsub.transport;

import com.becon.opencelium.backend.execution.logger.pubsub.ExecutionEventConsumer;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionFinishedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionStartedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.AsyncQueueExecutionEventTransport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InOrder;
import org.mockito.Mockito;

import java.util.stream.Stream;

import static com.becon.opencelium.backend.constant.LogConstant.FAIL;
import static com.becon.opencelium.backend.constant.LogConstant.SUCCESS;
import static com.becon.opencelium.backend.constant.LogConstant.TERMINATED;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link AsyncQueueExecutionEventTransport}.
 * <p>
 * No Spring context is loaded. No dependency is required to set up test class.
 * Run with: ./gradlew test
 */
@DisplayName("AsyncQueueExecutionEventTransport — unit")
class AsyncQueueExecutionEventTransportTest {
    private final ExecutionEventConsumer consumer = Mockito.mock(ExecutionEventConsumer.class);
    private AsyncQueueExecutionEventTransport transport;

    @AfterEach
    void tearDown() {
        if (transport != null) {
            transport.stop();
        }
    }


    @Test
    void transportProcessesEventsInFifoOrder() {
        transport = new AsyncQueueExecutionEventTransport(consumer);
        transport.start();

        // GIVEN
        ExecutionEvent first = new ExecutionStartedEvent(42L, 1L, 1, "2026-07-29");
        ExecutionEvent second = new ExecutionFinishedEvent(42L, null, SUCCESS);

        // WHEN
        transport.accept(first);
        transport.accept(second);
        transport.stop();

        // THEN
        InOrder inOrder = Mockito.inOrder(consumer);
        inOrder.verify(consumer).dispatch(first);
        inOrder.verify(consumer).dispatch(second);
    }

    @ParameterizedTest
    @MethodSource("executionResults")
    void transportProcessesEventsRegardlessOfExecutionResult(String result) {
        transport = new AsyncQueueExecutionEventTransport(consumer);
        transport.start();

        // GIVEN
        ExecutionEvent first = new ExecutionStartedEvent(42L, 1L, 1, "2026-07-29");
        ExecutionEvent second = new ExecutionFinishedEvent(42L, null, result);

        // WHEN
        transport.accept(first);
        transport.accept(second);

        // THEN
        verify(consumer, timeout(2_000)).dispatch(first);
        verify(consumer, timeout(2_000)).dispatch(second);
    }

    @Test
    void transportContinuesProcessingSubsequentEventsWhenConsumerThrows() {
        transport = new AsyncQueueExecutionEventTransport(consumer);
        transport.start();

        // GIVEN
        ExecutionEvent failed = new ExecutionFinishedEvent(41L, null, FAIL);
        ExecutionEvent following = new ExecutionStartedEvent(42L, 1L, 2, "2026-07-29");

        doThrow(new RuntimeException("Consumer failed to process an event"))
                .when(consumer).dispatch(failed);

        // WHEN
        transport.accept(failed);
        transport.accept(following);

        // THEN
        verify(consumer, timeout(2_000)).dispatch(failed);
        verify(consumer, timeout(2_000)).dispatch(following);
    }

    @Test
    void transportRejectsEventsBeforeStartAndAfterStop() {
        transport = new AsyncQueueExecutionEventTransport(consumer);

        // GIVEN
        ExecutionEvent event = new ExecutionFinishedEvent(42L, null, SUCCESS);

        // THEN before
        assertThrows(IllegalStateException.class, () -> transport.accept(event));

        // WHEN
        transport.start();
        transport.stop();

        // THEN after
        assertThrows(IllegalStateException.class, () -> transport.accept(event));
    }

    @Test
    void transportProcessesEventsAlreadyInQueueAfterStop() {
        transport = new AsyncQueueExecutionEventTransport(consumer);
        transport.start();

        // GIVEN
        ExecutionEvent first = new ExecutionFinishedEvent(41L, null, TERMINATED);
        ExecutionEvent second = new ExecutionStartedEvent(42L, 1L, 2, "2026-07-29");

        // WHEN
        transport.accept(first);
        transport.accept(second);
        transport.stop();

        // THEN
        await().atMost(2, SECONDS).untilAsserted(() -> {
            verify(consumer).dispatch(first);
            verify(consumer).dispatch(second);
        });
    }


    private static Stream<String> executionResults() {
        return Stream.of(SUCCESS, FAIL, TERMINATED);
    }
}
