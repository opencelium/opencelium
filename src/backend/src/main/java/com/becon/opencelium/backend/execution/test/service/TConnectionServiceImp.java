package com.becon.opencelium.backend.execution.test.service;

import com.becon.opencelium.backend.execution.test.TConnectionExecutor;
import com.becon.opencelium.backend.execution.test.TExecutionMediator;
import com.becon.opencelium.backend.execution.test.entity.TConnection;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.resource.connection.test.TestConnectionResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class TConnectionServiceImp implements TConnectionService {

    @Autowired
    private ConnectorServiceImp connectorServiceImp;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public TConnection run(ConnectionNode connectionNode, List<EnhancementNode> enhancementNodes, List<Enhancement> enhancements) {

        Map<String, List<RequestData>> requestDataMap = getRequestData(connectionNode);// contains both invokers request data

        TExecutionMediator executionMediator = new TExecutionMediator.Builder()
                .setConnectionNode(connectionNode)
                .setEnhancementNodes(enhancementNodes)
                .setEnhancements(enhancements)
                .setRequestDataMap(requestDataMap)
                .setInvokerService(invokerServiceImp)
                .setRestTemplate(restTemplate)
                .build();

        TConnectionExecutor connectionExecutor = new TConnectionExecutor(executionMediator);
        connectionExecutor.execute();
        return executionMediator.getTestConnection();
    }

    @Override
    public TestConnectionResource toResource(TConnection tConnection) {
        return null;
    }

    @Override
    public ConnectionNode fillTemporaryIds(ConnectionNode connectionNode) {

        int index = 0;

        connectionNode.setConnectionId(Integer.toUnsignedLong(index++));
        ConnectorNode fromConnector = connectionNode.getFromConnector();
        fromConnector.setConnectorId(index++);
        ConnectorNode toConnector = connectionNode.getToConnector();
        toConnector.setConnectorId(index++);

        MethodNode startMethod = fromConnector.getStartMethod();
        OperatorNode startOperator = fromConnector.getStartOperator();
        setMethodIds(startMethod, index);
        setOperatorIds(startOperator, index);
        return connectionNode;
    }

    private Map<String, List<RequestData>> getRequestData(ConnectionNode connectionNode) {
        Map<String, List<RequestData>> requestDataMap = new HashMap<>();

        int fromConnectorId = connectionNode.getFromConnector().getConnectorId();
        Connector fromConnector = connectorServiceImp.findById(fromConnectorId)
                .orElseThrow(() -> new RuntimeException("Connector " + fromConnectorId + " not found when getting RequestData")) ;

        int toConnectorId = connectionNode.getToConnector().getConnectorId();
        Connector toConnector = connectorServiceImp.findById(toConnectorId)
                .orElseThrow(() -> new RuntimeException("Connector " + toConnectorId + " not found when getting RequestData")) ;

        requestDataMap.put(fromConnector.getInvoker(), fromConnector.getRequestData());
        requestDataMap.put(toConnector.getInvoker(), toConnector.getRequestData());

        return requestDataMap;
    }

    private void setMethodIds(MethodNode methodNode, int index) {
        if (methodNode == null) {
            return;
        }

        methodNode.setId(Integer.toUnsignedLong(index++));

        RequestNode requestNode = methodNode.getRequestNode();
        setRequestIds(requestNode, index);

        ResponseNode responseNode = methodNode.getResponseNode();
        setResponseIds(responseNode, index);

        setMethodIds(methodNode.getNextFunction(), index);
        setOperatorIds(methodNode.getNextOperator(), index);
    }

    private void setResponseIds(ResponseNode responseNode, int index) {
        responseNode.setId(Integer.toUnsignedLong(index++));

        responseNode.getFail().setId(Integer.toUnsignedLong(index++));
        responseNode.getFail().getBody().setId(Integer.toUnsignedLong(index++));
        setFieldIds(responseNode.getFail().getBody().getFields(), index);

        responseNode.getSuccess().setId(Integer.toUnsignedLong(index++));
        responseNode.getSuccess().getBody().setId(Integer.toUnsignedLong(index++));
        setFieldIds(responseNode.getSuccess().getBody().getFields(), index);
    }

    private void setRequestIds(RequestNode requestNode, int index) {
        requestNode.setId(Integer.toUnsignedLong(index++));
        requestNode.getBodyNode().setId(Integer.toUnsignedLong(index++));

        setFieldIds(requestNode.getBodyNode().getFields(), index);
    }

    private void setFieldIds(List<FieldNode> fields, int index) {
        if (fields == null) {
            return;
        }

        for (FieldNode field : fields) {
            field.setId(Integer.toUnsignedLong(index++));
            if (field.getChild() != null) {
                setFieldIds(field.getChild(), index);
            }
        }
    }

    private void setOperatorIds(OperatorNode operatorNode, int index) {
        if (operatorNode == null) {
            return;
        }

        operatorNode.setId(Integer.toUnsignedLong(index++));

        setMethodIds(operatorNode.getBodyFunction(), index);
        setOperatorIds(operatorNode.getBodyOperator(), index);

        setMethodIds(operatorNode.getNextFunction(), index);
        setOperatorIds(operatorNode.getNextOperator(), index);
    }
}
