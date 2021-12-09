/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.resource.connection.ConditionResource;
import com.becon.opencelium.backend.resource.connection.MethodResource;
import com.becon.opencelium.backend.resource.connection.OperatorResource;
import com.becon.opencelium.backend.resource.connector.BodyResource;
import com.becon.opencelium.backend.resource.connector.RequestResource;
import com.becon.opencelium.backend.resource.connector.ResponseResource;
import com.becon.opencelium.backend.resource.connector.ResultResource;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ActionUtility {

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Autowired
    private ValidationContext validationContext;

    private String methodIndex;
    private String methodName; // need for determine type of field
    private String result; // need for determine type of field
    private String exchangeType; // need for determine type of field
    private ConnectorNode connectorNode; // need for determine type of field
    private String connectionName;

    public MethodNode buildMethodEntity(List<MethodResource> methodResources,
                                        List<OperatorResource> operatorResources,
                                        final ConnectorNode connectorNode,
                                        final String connectionName){

        LinkedList<String> indexes = getIndexes(methodResources, operatorResources);
        if (indexes.isEmpty() || !startsWithMethod(indexes.get(0), methodResources)){
            return null;
        }

        String i = indexes.pop();
        String nextElement = "";
        if (!indexes.isEmpty()){
            nextElement = indexes.get(0);
        }
        MethodResource methodResource = methodResources.stream()
                .filter(m -> m.getIndex().equals(i)).findAny().get();

        methodResources.remove(methodResource);

        ErrorMessageData messageData = validationContext.get(connectionName);
        if (messageData == null){
            messageData = new ErrorMessageData();
            validationContext.put(connectionName, messageData);
        }
        messageData.setConnectorId(connectorNode.getConnectorId());
        messageData.setIndex(methodResource.getIndex());
        messageData.setLocation("method");

        this.methodIndex = methodResource.getIndex();
        this.methodName = methodResource.getName();
        this.connectorNode = connectorNode;
        this.connectionName = connectionName;

        MethodNode methodNode = toNodeEntity(methodResource);

        methodNode.setRequestNode(buildRequest(methodResource.getRequest()));
        methodNode.setResponseNode(buildResponse(methodResource.getResponse()));

        if (i.length() == nextElement.length()){
            MethodNode methodNode1 = buildMethodEntity(methodResources, operatorResources, connectorNode, this.connectionName);
            if (methodNode1 != null) {
                methodNode.setNextFunction(methodNode1);
            } else {
                methodNode.setNextOperator(buildOperatorEntity(methodResources, operatorResources, connectorNode, this.connectionName));
            }
        }

        return methodNode;
    }

    private ResponseNode buildResponse(ResponseResource responseResource){
        this.exchangeType = "response";
        ResponseNode responseNode = new ResponseNode();
//        responseNode.setId(responseResource.getNodeId());
        responseNode.setFail(buildResult(responseResource.getFail(), "fail"));
        responseNode.setSuccess(buildResult(responseResource.getSuccess(), "success"));
        return responseNode;
    }



    private ResultNode buildResult(ResultResource resultResource, String result){
        this.result = result;
        ResultNode resultNode = new ResultNode();
//        resultNode.setId(resultResource.getNodeId());
        resultNode.setName(result);
        resultNode.setStatus(resultResource.getStatus());
        if (resultResource.getBody() != null){
            resultNode.setBody(buildBody(resultResource.getBody()));
        }
        return resultNode;
    }

    private RequestNode buildRequest(RequestResource requestResource){
        this.exchangeType = "request";
        this.result = "";
        RequestNode requestNode = new RequestNode();
//        requestNode.setId(requestResource.getNodeId());
        requestNode.setEndpoint(requestResource.getEndpoint());
        requestNode.setMethod(requestResource.getMethod());
        if (requestResource.getHeader() != null){
            requestNode.setHeaderNode(buildHeader(requestResource.getHeader()));
        }

        if (requestResource.getBody() != null){
            requestNode.setBodyNode(buildBody(requestResource.getBody()));
        }
        return requestNode;
    }

    private List<FieldNode> buildFields(Map<String, Object> bodyResource){
        List<FieldNode> fieldNodeList = new ArrayList<>();
        ErrorMessageData messageData = validationContext.get(connectionName);
        if (messageData == null){
            messageData = new ErrorMessageData();
            validationContext.put(connectionName, messageData);
        }
        messageData.setConnectorId(connectorNode.getConnectorId());
        messageData.setIndex(methodIndex);
        messageData.setLocation("body");

        bodyResource.forEach((k,v) -> {
            FieldNode fieldNode = new FieldNode();
            fieldNode.setName(k);

            if (v == null){
                v = "";
            }

            // TODO: bug when determining invoker file in ref.
//            if (v instanceof String && fieldNodeService.hasReference(v.toString())){
//                if (!fieldNodeService.existsInInvokerMethod(connectorNode.getName(), methodName, v.toString())){
//                    throw new RuntimeException("FIELD_NOT_FOUND_IN_REF_METHOD");
//                }
//            }

            String type = invokerServiceImp.findFieldType(connectorNode.getName(), methodName, exchangeType, result, k);
            // for situation = "ConfigItem": "#FFCFB5.(response).success.result[];#C77E7E.(response).success.result[]"
            if ((type.equals("object") || type.equals("array")) && ( v instanceof String )){
                fieldNode.setType("array");
                if (type.equals("object")) {
                    fieldNode.setType("object");
                }
                fieldNode.setValue(v.toString());
                fieldNodeList.add(fieldNode);
                return;
            }

            if (v instanceof Map || v instanceof List){
                ObjectMapper objectMapper = new ObjectMapper();
                Map<String, Object> child = new LinkedHashMap<>();
                if ((v instanceof ArrayList)) {
                    fieldNode.setType("array");
                    if (((ArrayList) v).isEmpty()){
                        fieldNode.setValue("");
                    } else if (!(((ArrayList) v).get(0) instanceof HashMap)){
                        child = null;
                        ArrayList<String> array = (ArrayList) v;
                        String elements = "";
                        for (String str : array) {
                            elements = elements + "," + str;
                        }
                        elements = "[" + elements.replaceFirst(",", "") + "]";
                        fieldNode.setValue(elements);
                    } else {
                        ArrayList<Map<String, Object>> ar = objectMapper.convertValue(v, ArrayList.class);
                        child = ar.get(0);
                    }
                } else {
                    fieldNode.setType("object");
                    child = objectMapper.convertValue(v, Map.class);
                }

                if (child != null){
                    fieldNode.setChild(buildFields(child));
                }
                fieldNodeList.add(fieldNode);
                return;
            }
            fieldNode.setType("string");
            fieldNode.setValue(v.toString());
            fieldNodeList.add(fieldNode);
        });
        return fieldNodeList;
    }

    private BodyNode buildBody(BodyResource bodyResource){
        BodyNode bodyNode = new BodyNode();
        ErrorMessageData messageData = validationContext.get(connectionName);
        messageData.setLocation("body");
        bodyNode.setData(bodyResource.getData());
        bodyNode.setFormat(bodyResource.getFormat());
        bodyNode.setType(bodyResource.getType());
        bodyNode.setFields(buildFields(bodyResource.getFields()));
        return bodyNode;
    }

    private HeaderNode buildHeader(Map<String, String> headerResource){
        HeaderNode headerNode = new HeaderNode();
        ErrorMessageData messageData = validationContext.get(connectionName);
        messageData.setLocation("header");

        List<ItemNode> itemNodes = headerResource.entrySet().stream()
                .map(k -> new ItemNode(k.getKey(), k.getValue())).collect(Collectors.toList());

        headerNode.setItems(itemNodes);
        return headerNode;
    }

    public StatementNode buildOperatorEntity(List<MethodResource> methodResources,
                                             List<OperatorResource> operatorResources,
                                             ConnectorNode connectorNode,
                                             String connectionName){
        String invokerName = connectorNode.getName();
        LinkedList<String> indexes = getIndexes(methodResources, operatorResources);
        if (indexes.isEmpty() || startsWithMethod(indexes.get(0), methodResources)){
            return null;
        }

        String i = indexes.pop();
        String nextElement = "";
        if (!indexes.isEmpty()){
            nextElement = indexes.get(0);
        }

        OperatorResource operatorResource = operatorResources.stream()
                .filter(m -> m.getIndex().equals(i)).findAny().get();

        ErrorMessageData messageData = validationContext.get(connectionName);
        if (messageData == null){
            messageData = new ErrorMessageData();
            validationContext.put(connectionName, messageData);
        }
        messageData.setConnectorId(connectorNode.getConnectorId());
        messageData.setLocation("operator");
        messageData.setIndex(operatorResource.getIndex());

        operatorResources.remove(operatorResource);

        StatementNode statementNode = toOperatorNode(operatorResource);

        statementNode.setIterator(operatorResource.getIterator());
        statementNode.setRightStatementVariable(ConditionUtility.buildStringStatement(operatorResource.getCondition().getRightStatement()));
        statementNode.setLeftStatementVariable(ConditionUtility.buildStringStatement(operatorResource.getCondition().getLeftStatement()));

        if (i.length() < nextElement.length()){
            statementNode.setBodyOperator(buildOperatorEntity(methodResources, operatorResources, connectorNode, connectionName));
            statementNode.setBodyFunction(buildMethodEntity(methodResources, operatorResources, connectorNode, connectionName));
        }

        List<String> restIndex = getIndexes(methodResources, operatorResources);
        if (restIndex.isEmpty()){
            nextElement = "";
        } else {
            nextElement = restIndex.get(0);
        }

        if (i.length() == nextElement.length()){
            StatementNode statementNode1 = buildOperatorEntity(methodResources, operatorResources, connectorNode, connectionName);
            if (statementNode1 != null) {
                statementNode.setNextOperator(statementNode1);
            } else {
                statementNode.setNextFunction(buildMethodEntity(methodResources, operatorResources, connectorNode, connectionName));
            }
        }
        return statementNode;
    }

    private String buildCondition(ConditionResource conditionResource){
        if (conditionResource.getLeftStatement().equals("")){
            throw new RuntimeException("Exchange type not found");
        }
        String left = conditionResource.getLeftStatement().getColor() + ".(" + conditionResource.getLeftStatement().getType()
                + ")." + conditionResource.getLeftStatement().getField();

        String right = "";
        if (conditionResource.getRightStatement( )!= null && !conditionResource.getRightStatement().equals("")) {

            right = conditionResource.getRightStatement().getColor() + "." + conditionResource.getRightStatement().getType()
                    + "." + conditionResource.getRightStatement().getField();
            if (conditionResource.getRightStatement().getColor().equals("") && conditionResource.getRightStatement().getType().equals("")){
                right = conditionResource.getRightStatement().getField();
            }
        }
        String operator = conditionResource.getRelationalOperator();
        return left + operator + right;
    }

    // TODO: need to refactor sorting of indexes. Doesn't works when index more than 10
    private LinkedList<String> getIndexes(List<MethodResource> methodResources, List<OperatorResource> operatorResources){
        LinkedList<String> indexes = new LinkedList<>();
        if (!methodResources.isEmpty()){
            methodResources.forEach(m -> {
                indexes.add(m.getIndex());
            });
        }

        if (!operatorResources.isEmpty()){
            operatorResources.forEach(o -> {
                indexes.add(o.getIndex());
            });
        }
        Collections.sort(indexes);
        return indexes;
    }

    private boolean startsWithMethod(String index, List<MethodResource> methodResources){
        return methodResources.stream().anyMatch(m -> m.getIndex().equals(index));
    }

    private MethodNode toNodeEntity(MethodResource methodResource){
        MethodNode methodNode = new MethodNode();
        methodNode.setIndex(methodResource.getIndex());
        methodNode.setName(methodResource.getName());
        methodNode.setColor(methodResource.getColor());
        methodNode.setLabel(methodResource.getLabel());
        return methodNode;
    }

    private StatementNode toOperatorNode(OperatorResource operatorResource){
        StatementNode statementNode = new StatementNode();
        statementNode.setIndex(operatorResource.getIndex());
        statementNode.setType(operatorResource.getType());
        statementNode.setOperand(operatorResource.getCondition().getRelationalOperator());
        return statementNode;
    }
}
