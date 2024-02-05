package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ConnectionExecutor {
    private final Map<String, Object> queryParams;
    private final ConnectionEx connection;
    private final ProxyEx proxy;

    public ConnectionExecutor(Map<String, Object> queryParams, ConnectionEx connection, ProxyEx proxy) {
        this.queryParams = queryParams;
        this.connection = connection;
        this.proxy = proxy;
    }

    public void start() {
        Connector source = Connector.fromEx(connection.getSource());
        Connector target = Connector.fromEx(connection.getTarget());
        List<FieldBind> fieldBind = connection.getFieldBind().stream().map(FieldBind::fromEx).collect(Collectors.toList());

        ExecutionManager executionManager = new ExecutionManagerImpl(queryParams, source, target, fieldBind);

        ConnectorExecutor sourceEx = new ConnectorExecutor(connection.getSource(), executionManager, getRestTemplate(source));
        ConnectorExecutor toEx = new ConnectorExecutor(connection.getTarget(), executionManager, getRestTemplate(target));

        sourceEx.start();
        toEx.start();
    }

    private RestTemplate getRestTemplate(Connector connector) {
        // TODO: where to get timeout ?
        int timeout = 5000;
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxy.getHost(), proxy.getPort(), proxy.getUser(), proxy.getPassword(), connector.isSslCert(), timeout));
        if (timeout > 0) {
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }

        return restTemplateBuilder.build();
    }
}
