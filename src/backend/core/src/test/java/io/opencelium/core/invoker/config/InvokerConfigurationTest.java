package io.opencelium.core.invoker.config;

import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.InvokerWriter;
import io.opencelium.core.invoker.ReadResult;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static org.assertj.core.api.Assertions.assertThat;

class InvokerConfigurationTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(InvokerConfiguration.class);

    @Test
    void contextProvidesOneBeanForEveryInvokerContract() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(InvokerReader.class);
            assertThat(context).hasSingleBean(InvokerWriter.class);
        });
    }

    @Test
    void injectedContractsWorkTogetherWhenAnInvokerIsReadWrittenAndReadAgain() {
        contextRunner.run(context -> {
            InvokerReader reader = context.getBean(InvokerReader.class);
            InvokerWriter writer = context.getBean(InvokerWriter.class);

            ReadResult original = reader.read(bytes(V6_SERVICE_DESK));

            assertThat(reader.read(writer.write(original.invoker())).invoker()).isEqualTo(original.invoker());
        });
    }
}
