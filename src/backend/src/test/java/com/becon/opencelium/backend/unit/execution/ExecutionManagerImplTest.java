package com.becon.opencelium.backend.unit.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.execution.ExecutionManagerImpl;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for how {@link ExecutionManagerImpl} is created and which extractor it resolves
 * references with.
 */
@DisplayName("ExecutionManagerImpl — unit")
class ExecutionManagerImplTest {

    @BeforeEach
    void unbindExecutionLogger() {
        ThreadLocalOcLogger.clear();
    }

    @Test
    void getValueUsesGivenExtractorWhenFactoryIsGiven() {
        ExecutionManager manager = new ExecutionManagerImpl(
                Map.of(), List.of(), Map.of(), Map.of(), Map.of(),
                self -> reference -> "resolved:" + reference);

        Object value = manager.getValue("${status}");

        assertThat(value).isEqualTo("resolved:${status}");
    }

    @Test
    @DisplayName("constructor — needs no execution logger bound to the thread")
    void constructorSucceedsWhenNoLoggerIsBound() {
        assertThatCode(() -> new ExecutionManagerImpl(Map.of(), List.of(), Map.of(), Map.of(), Map.of()))
                .doesNotThrowAnyException();
    }
}
