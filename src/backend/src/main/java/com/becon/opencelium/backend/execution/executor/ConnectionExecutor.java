package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.executor.model.FieldBind;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.masking.MaskingServiceImp;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import com.becon.opencelium.backend.resource.execution.ExecutionObj;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
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
    private final OcLogger<ExecutionLog> executionLogger;
    private final MaskingService masking;
    private final ProxyEx proxy;
    private ExecutionManager executionManager;

    public ConnectionExecutor(ExecutionObj executionObj, OcLogger<ExecutionLog> executionLogger, List<MaskingRule> rules) {
        this.webhookVars = executionObj.getWebhookVars();
        this.connection = executionObj.getConnection();
        this.proxy = executionObj.getProxy();

        this.executionLogger = executionLogger;
        this.masking = new MaskingServiceImp(rules);
    }

    public void start() {
        List<FieldBind> fieldBind = connection.getFieldBind().stream().map(FieldBind::fromEx).collect(Collectors.toList());
        executionManager = new ExecutionManagerImpl(webhookVars, connection.getFlowcharts(), fieldBind);

        ExecutorService executorService = new ExecutorService(connection.getExecutionPlan());
        for (FlowchartEx flowchart: connection.getFlowcharts()) {
            executorService.submit(flowchart.getFlowId(), new FlowchartExecutor(flowchart, executionManager, getRestTemplate(flowchart), executionLogger, masking));
        }

        executorService.execute();
    }

    public List<Operation> getOperations() {
        if (executionManager == null) {
            return List.of();
        }
        return executionManager.getAllOperations();
    }

    private RestTemplate getRestTemplate(FlowchartEx flowchart) {
        int timeout = flowchart.getTimeout();
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxy.getHost(), proxy.getPort(), proxy.getUser(), proxy.getPassword(), flowchart.isSslCert(), timeout));
        if (timeout > 0) {
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }

        return restTemplateBuilder.build();
    }
}
