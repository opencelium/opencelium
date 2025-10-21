package com.becon.opencelium.backend.execution.executor;

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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ConnectionExecutor {
    private final ConnectionEx connection;
    private final Map<String, Object> webhookVars;
    private final MaskingService masking;
    private final ProxyEx proxy;
    private final OcLogger<ExecutionLog> executionLogger;
    private ExecutionManager executionManager;

    public ConnectionExecutor(ExecutionObj executionObj, OcLogger<ExecutionLog> executionLogger, List<MaskingRule> rules) {
        this.connection = executionObj.getConnection();
        this.webhookVars = executionObj.getWebhookVars();
        this.masking = new MaskingServiceImp(rules);
        this.proxy = executionObj.getProxy();
        this.executionLogger = executionLogger;
    }

    public void start() {
        List<FieldBind> fieldBind = connection.getFieldBind().stream().map(FieldBind::fromEx).collect(Collectors.toList());
        this.executionManager = new ExecutionManagerImpl(webhookVars, connection.getFlowcharts(), fieldBind);

        ExecutorService executorService = new ExecutorService(connection.getExecutionPlan());
        for (FlowchartEx flowchart : connection.getFlowcharts()) {
            executorService.submit(flowchart.getFlowId(), new FlowchartExecutor(
                    flowchart,
                    executionManager,
                    executionLogger,
                    masking,
                    proxy,
                    connection.getExecutionPlan().getOnError()
            ));
        }

        executorService.execute();
    }

    public List<Operation> getOperations() {
        if (executionManager == null) {
            return List.of();
        }
        return executionManager.getAllOperations();
    }
}
