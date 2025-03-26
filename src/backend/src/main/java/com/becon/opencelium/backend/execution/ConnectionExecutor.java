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
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final boolean createZip;
    private ExecutionManager executionManager;

    public ConnectionExecutor(ExecutionObj executionObj, List<MaskingRule> rules, boolean createZip, long timestamp, SimpMessagingTemplate simpMessagingTemplate) {
        this.webhookVars = executionObj.getWebhookVars();
        this.connection = executionObj.getConnection();
        this.proxy = executionObj.getProxy();
        this.masking = new MaskingServiceImp(rules);
        this.createZip = createZip;

        String loggerId = String.format("%d_%d", executionObj.getConnection().getConnectionId(), timestamp);
        this.logger = new OcLogger<>(executionObj.getLogger().isWSocketOpen(), simpMessagingTemplate, new ExecutionLog(), createZip, loggerId, ConnectionExecutor.class);

        if (!executionObj.getLogger().isDebugMode()) {
            logger.disable();
        }
    }

    public void start() {
        Connector source = Connector.fromEx(connection.getSource());
        Connector target = Connector.fromEx(connection.getTarget());
        List<FieldBind> fieldBind = connection.getFieldBind().stream().map(FieldBind::fromEx).collect(Collectors.toList());

        executionManager = new ExecutionManagerImpl(webhookVars, source, target, fieldBind);

        ConnectorExecutor sourceEx = new ConnectorExecutor(connection.getSource(), executionManager, getRestTemplate(source), logger, masking, "CONN1");
        ConnectorExecutor toEx = new ConnectorExecutor(connection.getTarget(), executionManager, getRestTemplate(target), logger, masking, "CONN2");

        try {
            sourceEx.start();
            toEx.start();
        } catch (Exception e) {
            logger.logAndSend(e);

            if (!createZip) {
                throw e;
            }
        } finally {
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
