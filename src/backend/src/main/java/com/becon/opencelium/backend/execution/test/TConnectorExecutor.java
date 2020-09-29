package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TConnectorExecutor {

    private TExecutionMediator executionMediator;

    public TConnectorExecutor(TExecutionMediator executionMediator) {
        this.executionMediator = executionMediator;
    }

    public void execute() {

        TMethodExecutor tMethodExecutor = new TMethodExecutor(executionMediator);
        TOperatorExecutor tOperatorExecutor = new TOperatorExecutor(executionMediator);
        InvokerService invokerService = executionMediator.getInvokerService();
        Map<String, List<MethodNode>> operationNodes = new HashMap<>();
        List<MethodNode> methods = new ArrayList<>();

        ConnectorNode connectorNode = executionMediator.getConnectorNode();
        Invoker invoker = invokerService.findByName(connectorNode.getName());

        collectMethods(connectorNode.getStartOperator(), methods);
        collectMethods(connectorNode.getStartMethod(), methods);
        operationNodes.put(executionMediator.getConn(), methods);

        executionMediator.setMethods(operationNodes);
        executionMediator.setInvoker(invoker);

        MethodNode methodNode = connectorNode.getStartMethod();
        StatementNode statementNode = connectorNode.getStartOperator();
        tMethodExecutor.execute(methodNode);
        tOperatorExecutor.execute(statementNode);
    }

    private void collectMethods(Object operationNode, List<MethodNode> methods) {
        if (operationNode == null) {
            return;
        }
        StatementNode statementNode = null;
        MethodNode methodNode = null;
        if (operationNode instanceof StatementNode) {
            statementNode = (StatementNode) operationNode;
        } else if (operationNode instanceof MethodNode) {
            methodNode = (MethodNode) operationNode;
        }

        if (methodNode != null) {
            methods.add(methodNode);
            if (methodNode.getNextFunction() != null) {
                collectMethods(methodNode.getNextFunction(), methods);
            }

            if (methodNode.getNextOperator() != null) {
                collectMethods(methodNode.getNextOperator(), methods);
            }
        } else {
//            operations.add(operationNode);
            if (statementNode.getNextFunction() != null) {
                collectMethods(statementNode.getNextFunction(), methods);
            }

            if (statementNode.getNextOperator() != null) {
                collectMethods(statementNode.getNextOperator(), methods);
            }

            if (statementNode.getBodyFunction() != null) {
                collectMethods(statementNode.getBodyFunction(), methods);
            }

            if (statementNode.getBodyOperator() != null) {
                collectMethods(statementNode.getBodyOperator(), methods);
            }
        }
    }
}
