package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.execution.MessageContainer;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorFactory;
import com.becon.opencelium.backend.neo4j.entity.OperatorNode;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;
import com.becon.opencelium.backend.neo4j.service.FieldNodeService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class TOperatorExecutor {

    private TExecutionMediator executionMediator;
    private TMethodExecutor methodExecutor;

    public TOperatorExecutor(TExecutionMediator executionMediator) {
        this.executionMediator = executionMediator;
        this.methodExecutor = executionMediator.getMethodExecutor();
    }

    public void execute(OperatorNode operatorNode) {
        if (operatorNode == null) {
            return;
        }
        executionMediator.setCurrentOperator(operatorNode);

        switch (operatorNode.getType()) {
            case "if":
                executeIfStatement(operatorNode);
                break;
            case "loop":
                executeLoopStatement(operatorNode);
                break;
            default:
        }

        methodExecutor.execute(operatorNode.getNextFunction());
        this.execute(operatorNode.getNextOperator());
    }

    private void executeIfStatement(OperatorNode ifStatement){
        OperatorFactory operatorFactory = new OperatorFactory();
        Operator operator = operatorFactory.getOperator(ifStatement.getOperand());
        Object leftStatement = getValue(ifStatement.getLeftStatement(), "");
        System.out.println("=============== " + ifStatement.getOperand() + " =================");
        if(leftStatement != null){
            System.out.println("Left Statement: " + leftStatement.toString());
        }

        String ref = convertToRef(ifStatement.getLeftStatement());
        Object rightStatement = getValue(ifStatement.getRightStatement(), ref);
        if (rightStatement != null){
            System.out.println("Right Statement: " + rightStatement.toString());
        }

        if (operator.compare(leftStatement, rightStatement)){
            methodExecutor.execute(ifStatement.getBodyFunction());
            this.execute(ifStatement.getBodyOperator());
        }
    }

    private void executeLoopStatement(OperatorNode operatorNode){
        StatementNode leftStatement = operatorNode.getLeftStatement();
        String methodKey = leftStatement.getColor();
        String condition = leftStatement.getColor() + ".(" + leftStatement.getType() + ")." + leftStatement.getFiled();
//        // TODO: Need to rework for "request" types too.
//        String exchangeType = ConditionUtility.getExchangeType(condition);

        Map<String, Integer> loopStack = executionMediator.getLoopIndex();
        MessageContainer message = executionMediator.getResponseData().stream()
                .filter(m -> m.getMethodKey().equals(methodKey))
                .findFirst()
                .orElse(null);
        List<Map<String, Object>> array =
                (List<Map<String, Object>>) message.getValue(condition, loopStack);

        for (int i = 0; i < array.size(); i++) {
            System.out.println("Loop " + condition + "-------- index : " + i);
            loopStack.put(condition, i);
            methodExecutor.execute(operatorNode.getBodyFunction());
            this.execute(operatorNode.getBodyOperator());
        }

        if (loopStack.containsKey(condition)){
            loopStack.remove(condition);
        }
        methodExecutor.execute(operatorNode.getNextFunction());
        this.execute(operatorNode.getNextOperator());
    }

    private Object getValue(StatementNode statementNode, String leftStatement) {
        if (statementNode == null) {
            return null;
        }

        if (statementNode.getRightPropertyValue() != null && !statementNode.getRightPropertyValue().isEmpty()) {
            List<Object> result = new ArrayList<>();
            String ref = convertToRef(statementNode);
            String rightPropertyValueRef = leftStatement + "." + statementNode.getRightPropertyValue();
            Object value;
            if (FieldNodeService.hasReference(ref)){
                value = executionMediator.getValueFromResponseData(ref);
                result.add(value);
            } else {
                result.add(statementNode.getFiled());
            }

            value = executionMediator.getValueFromResponseData(rightPropertyValueRef);
            result.add(value);
            return result;
        }

        String ref = convertToRef(statementNode);
        if (!FieldNodeService.hasReference(ref)){
            return statementNode.getFiled();
        }
        return executionMediator.getValueFromResponseData(ref);
    }

    private String convertToRef(StatementNode statementNode) {
        if (statementNode == null){
            return null;
        }
        return statementNode.getColor() + ".(" + statementNode.getType() + ")." + statementNode.getFiled();
    }
}
