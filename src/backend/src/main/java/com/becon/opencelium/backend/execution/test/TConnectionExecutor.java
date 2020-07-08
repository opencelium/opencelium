package com.becon.opencelium.backend.execution.test;


import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;

public class TConnectionExecutor {

    private TExecutionMediator executionMediator;

    public TConnectionExecutor(TExecutionMediator executionMediator) {
        this.executionMediator = executionMediator;
    }

    public void execute() {
        TConnectorExecutor tConnectorExecutor = new TConnectorExecutor(executionMediator);
        ConnectorNode fromConnector = executionMediator.getConnectionNode().getFromConnector();
        ConnectorNode toConnector = executionMediator.getConnectionNode().getToConnector();

        executionMediator.setConnectorNode(fromConnector);
        executionMediator.setConn(Constant.CONN_FROM);
        tConnectorExecutor.execute();

        executionMediator.setConnectorNode(toConnector);
        executionMediator.setConn(Constant.CONN_TO);
        tConnectorExecutor.execute();
    }
}
