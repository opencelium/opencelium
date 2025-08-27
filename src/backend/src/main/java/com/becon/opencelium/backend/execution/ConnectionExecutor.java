package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.masking.MaskingServiceImp;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ConnectionExecutor {
    private final Map<String, Object> webhookVars;
    private final ConnectionEx connection;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;
    private final ProxyEx proxy;
    private final long executionId;
    private ExecutionManager executionManager;

    public ConnectionExecutor(
            ExecutionObj executionObj, long executionId,
            String timestamp, List<MaskingRule> rules
    ) {
        this.webhookVars = executionObj.getWebhookVars();
        this.connection = executionObj.getConnection();
        this.proxy = executionObj.getProxy();
        this.executionId = executionId;
        this.masking = new MaskingServiceImp(rules);

        // logging files related setup
        this.logger = new OcLogger<>(
                executionObj.getLoggerConfiguration(), new ExecutionLog(),
                connection.getConnectionId(), timestamp, executionId, ConnectionExecutor.class
        );
    }

    public void start() {
        Connector source = Connector.fromEx(connection.getSource());
        Connector target = Connector.fromEx(connection.getTarget());
        List<FieldBind> fieldBind = connection.getFieldBind().stream().map(FieldBind::fromEx).collect(Collectors.toList());

        executionManager = new ExecutionManagerImpl(webhookVars, source, target, fieldBind);

        ConnectorExecutor sourceEx = new ConnectorExecutor(connection.getSource(), executionManager, getRestTemplate(source), logger, masking, "source");
        ConnectorExecutor targetEx = new ConnectorExecutor(connection.getTarget(), executionManager, getRestTemplate(target), logger, masking, "target");

        try {
            logger.logAndSend(String.format("phase=EXECUTION_START id=%d connectionId=%d", executionId, connection.getConnectionId()));

            sourceEx.start();
            targetEx.start();
        } finally {
            logger.logAndSend(String.format("phase=EXECUTION_END id=%d connectionId=%d", executionId, connection.getConnectionId()));
            logger.close(); // release resources
        }
    }

    public List<Operation> getOperations() {
        if (executionManager == null) {
            return List.of();
        }
        return executionManager.getAllOperations();
    }

    private RestTemplate getRestTemplate(Connector connector) {
        int timeout = connector.getTimeout();
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxy.getHost(), proxy.getPort(), proxy.getUser(), proxy.getPassword(), connector.isSslCert(), timeout));
        if (timeout > 0) {
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }

        return restTemplateBuilder.build();
    }
}
