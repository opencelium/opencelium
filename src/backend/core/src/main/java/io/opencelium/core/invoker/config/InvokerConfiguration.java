package io.opencelium.core.invoker.config;

import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.InvokerWriter;
import io.opencelium.core.invoker.xml.XmlInvokerReader;
import io.opencelium.core.invoker.xml.XmlInvokerWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chooses the implementation behind each invoker contract. This is the only class that names them;
 * everything else injects {@link InvokerReader} and {@link InvokerWriter}.
 */
@Configuration(proxyBeanMethods = false)
public class InvokerConfiguration {

    @Bean
    InvokerReader invokerReader() {
        return new XmlInvokerReader();
    }

    @Bean
    InvokerWriter invokerWriter() {
        return new XmlInvokerWriter();
    }
}
