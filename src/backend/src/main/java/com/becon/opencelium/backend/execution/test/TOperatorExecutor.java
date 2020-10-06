package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.execution.MessageContainer;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.execution.statement.operator.factory.ComparisonOperatorFactory;
import com.becon.opencelium.backend.neo4j.entity.StatementNode;
import com.becon.opencelium.backend.neo4j.entity.StatementVariable;
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

    public void execute(StatementNode statementNode) {
        if (statementNode == null) {
            return;
        }
        executionMediator.setCurrentOperator(statementNode);

        switch (statementNode.getType()) {
            case "if":
                executeIfStatement(statementNode);
                break;
            case "loop":
                executeLoopStatement(statementNode);
                break;
            default:
        }

        methodExecutor.execute(statementNode.getNextFunction());
        this.execute(statementNode.getNextOperator());
    }

    private void executeIfStatement(StatementNode ifStatement){
        ComparisonOperatorFactory comparisonOperatorFactory = new ComparisonOperatorFactory();
        Operator operator = comparisonOperatorFactory.getOperator(ifStatement.getOperand());
        Object leftStatement = getValue(ifStatement.getLeftStatementVariable(), "");
        System.out.println("=============== " + ifStatement.getOperand() + " =================");
        if(leftStatement != null){
            System.out.println("Left Statement: " + leftStatement.toString());
        }

        String ref = convertToRef(ifStatement.getLeftStatementVariable());
        Object rightStatement = getValue(ifStatement.getRightStatementVariable(), ref);
        if (rightStatement != null){
            System.out.println("Right Statement: " + rightStatement.toString());
        }

        if (operator.compare(leftStatement, rightStatement)){
            methodExecutor.execute(ifStatement.getBodyFunction());
            this.execute(ifStatement.getBodyOperator());
        }
    }

    private void executeLoopStatement(StatementNode statementNode){
        StatementVariable leftStatement = statementNode.getLeftStatementVariable();
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
            methodExecutor.execute(statementNode.getBodyFunction());
            this.execute(statementNode.getBodyOperator());
        }

        if (loopStack.containsKey(condition)){
            loopStack.remove(condition);
        }
        methodExecutor.execute(statementNode.getNextFunction());
        this.execute(statementNode.getNextOperator());
    }

    private Object getValue(StatementVariable statementVariable, String leftStatement) {
        if (statementVariable == null) {
            return null;
        }

        if (statementVariable.getRightPropertyValue() != null && !statementVariable.getRightPropertyValue().isEmpty()) {
            List<Object> result = new ArrayList<>();
            String ref = convertToRef(statementVariable);
            String rightPropertyValueRef = leftStatement + "." + statementVariable.getRightPropertyValue();
            Object value;
            if (FieldNodeService.hasReference(ref)){
                value = executionMediator.getValueFromResponseData(ref);
                result.add(value);
            } else {
                result.add(statementVariable.getFiled());
            }

            value = executionMediator.getValueFromResponseData(rightPropertyValueRef);
            result.add(value);
            return result;
        }

        String ref = convertToRef(statementVariable);
        if (!FieldNodeService.hasReference(ref)){
            return statementVariable.getFiled();
        }
        return executionMediator.getValueFromResponseData(ref);
    }

    private String convertToRef(StatementVariable statementVariable) {
        if (statementVariable == null){
            return null;
        }
        return statementVariable.getColor() + ".(" + statementVariable.getType() + ")." + statementVariable.getFiled();
    }
}
