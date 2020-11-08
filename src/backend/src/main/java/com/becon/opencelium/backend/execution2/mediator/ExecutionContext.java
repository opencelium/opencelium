package com.becon.opencelium.backend.execution2.mediator;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.execution2.factory.ExecutionFactory;
import com.becon.opencelium.backend.execution2.factory.ControlStatementFactory;
import com.becon.opencelium.backend.neo4j.entity.*;

import java.util.HashMap;

public class ExecutionContext {

    private final InitialData initialData; // holds initial data of connection when execution starts running

    // Connector data
    private ConnectorNode currentCtor; // currently executing connector
    private String ctorDirection; // determines connector type "from" or "to"

    // Action data
    private Object action; // current method or operator
    private HashMap<ExecutionType, Execution> executionInstance = new HashMap<>();// contains execution objects



    public ExecutionContext(InitialData initialData) {
        this.initialData = initialData;
        getExecutionInstance().put(ExecutionType.METHOD, ExecutionFactory.newExecution(ExecutionType.METHOD));
        getExecutionInstance().put(ExecutionType.STATEMENT, ExecutionFactory.newExecution(ExecutionType.STATEMENT));
        getExecutionInstance().put(ExecutionType.IFSTATEMENT, ControlStatementFactory.newStatement(ExecutionType.IFSTATEMENT));
        getExecutionInstance().put(ExecutionType.FORSTATEMENT, ControlStatementFactory.newStatement(ExecutionType.FORSTATEMENT));
    }

    public InitialData getInitialData() {
        return initialData;
    }

    public ConnectorNode getCurrentCtor() {
        return currentCtor;
    }

    public void setCurrentCtor(ConnectorNode currentCtor) {
        this.currentCtor = currentCtor;
    }

    public String getCtorDirection() {
        return ctorDirection;
    }

    public void setCtorDirection(String ctorDirection) {
        this.ctorDirection = ctorDirection;
    }

    public Object getAction() {
        return action;
    }

    public void setAction(Object currentAction) {
        this.action = currentAction;
    }

    public HashMap<ExecutionType, Execution> getExecutionInstance() {
        return executionInstance;
    }
}
