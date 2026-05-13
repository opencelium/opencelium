package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.masking.MaskingServiceImp;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionConnector;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;

public class ConnectionExecutor {
    private final Map<String, Object> webhookVars;
    private final ConnectionEx connection;
    private final MaskingService masking;
    private final ProxyEx proxy;
    private ExecutionManager executionManager;

    public ConnectionExecutor(ExecutionObj executionObj, List<MaskingRule> rules) {
        this.webhookVars = executionObj.getWebhookVars();
        this.connection = executionObj.getConnection();
        this.proxy = executionObj.getProxy();

        this.masking = new MaskingServiceImp(rules);
    }

    public void start() {
        executionManager = new ExecutionManagerImpl(
                webhookVars,
                getFieldBind(),
                getRequestData(),
                getRestTemplate(),
                getPagination()
        );

        if (connection.getSource() != null) {
            ConnectorExecutor source = new ConnectorExecutor(connection.getSource(), executionManager, masking, "source");
            source.start();
        }

        if (connection.getTarget() != null) {
            ConnectorExecutor target = new ConnectorExecutor(connection.getTarget(), executionManager, masking, "target");
            target.start();
        }
    }

    public List<Operation> getOperations() {
        if (executionManager == null) {
            return List.of();
        }
        return executionManager.getAllOperations();
    }


    private List<FieldBind> getFieldBind() {
        return connection.getFieldBind().stream()
                .map(FieldBind::fromEx)
                .collect(Collectors.toList());
    }

    private Map<Integer, RestTemplate> getRestTemplate() {
        Map<Integer, RestTemplate> result = new HashMap<>();

        processConnectors((id, connector) ->
                result.put(id, buildRestTemplate(connector.isSslCert(), connector.getTimeout()))
        );

        return result;
    }

    private Map<Integer, Map<String, String>> getRequestData() {
        Map<Integer, Map<String, String>> result = new HashMap<>();

        processConnectors((id, connector) ->
                result.put(id, connector.getRequiredData())
        );

        return result;
    }

    private Map<Integer, Pagination> getPagination() {
        Map<Integer, Pagination> result = new HashMap<>();

        processConnectors((id, connector) ->
                result.put(id, connector.getPagination())
        );

        return result;
    }

    private RestTemplate buildRestTemplate(boolean sslCert, int timeout) {
        RestCustomizer customizer = new RestCustomizer(proxy.getHost(), proxy.getPort(), proxy.getUser(), proxy.getPassword(), sslCert, timeout);
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder(customizer);

        if (timeout > 0) {
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }

        return restTemplateBuilder.build();
    }

    private void processConnectors(BiConsumer<Integer, ExecutionConnector> consumer) {
        if (connection.getSource() != null) {
            var source = connection.getSource();
            consumer.accept(source.getId(), source);
        }

        if (connection.getTarget() != null) {
            var target = connection.getTarget();
            consumer.accept(target.getId(), target);
        }

        if (connection.getConnectors() != null) {
            connection.getConnectors().forEach(consumer);
        }
    }
}
