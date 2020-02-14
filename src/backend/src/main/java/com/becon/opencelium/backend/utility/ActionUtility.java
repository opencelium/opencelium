/*
 * // Copyright (C) <2019> <becon GmbH>
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
import com.becon.opencelium.backend.resource.connector.RequestResource;
import com.becon.opencelium.backend.resource.connector.ResponseResource;
import com.becon.opencelium.backend.resource.connector.ResultResource;
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

    private String methodName; // need for determine type of field
    private String result; // need for determine type of field
    private String exchangeType; // need for determine type of field
    private String invoker; // need for determine type of field

    public MethodNode buildMethodEntity(List<MethodResource> methodResources,
                                        List<OperatorResource> operatorResources,
                                        final String invokerName){
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

        this.methodName = methodResource.getName();
        this.invoker = invokerName;

        MethodNode methodNode = new MethodNode();
        methodNode.setId(methodResource.getNodeId());
        methodNode.setIndex(methodResource.getIndex());
        methodNode.setName(methodResource.getName());
        methodNode.setColor(methodResource.getColor());

        methodNode.setRequestNode(buildRequest(methodResource.getRequest()));
        methodNode.setResponseNode(buildResponse(methodResource.getResponse()));

        if (i.length() == nextElement.length()){ // TODO: should be refactored. Invoker name initialization is not clear
            methodNode.setNextFunction(buildMethodEntity(methodResources, operatorResources, this.invoker));
            methodNode.setNextOperator(buildOperatorEntity(methodResources, operatorResources, this.invoker));
        }

        return methodNode;
    }

    private ResponseNode buildResponse(ResponseResource responseResource){
        this.exchangeType = "response";
        ResponseNode responseNode = new ResponseNode();
        responseNode.setId(responseResource.getNodeId());
        responseNode.setFail(buildResult(responseResource.getFail(), "fail"));
        responseNode.setSuccess(buildResult(responseResource.getSuccess(), "success"));
        return responseNode;
    }



    private ResultNode buildResult(ResultResource resultResource, String result){
        this.result = result;
        ResultNode resultNode = new ResultNode();
        resultNode.setId(resultResource.getNodeId());
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
        requestNode.setId(requestResource.getNodeId());
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

        bodyResource.forEach((k,v) -> {
            FieldNode fieldNode = new FieldNode();
            fieldNode.setName(k);

            if (v == null){
                v = "";
            }

            String type = invokerServiceImp.findFieldType(this.invoker, methodName, exchangeType, result, k);
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

            if (v instanceof LinkedHashMap || v instanceof ArrayList){
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

    private BodyNode buildBody(Map<String, Object> body){
        BodyNode bodyNode = new BodyNode();
        bodyNode.setFields(buildFields(body));

        return bodyNode;
    }

    private HeaderNode buildHeader(Map<String, String> headerResource){
        HeaderNode headerNode = new HeaderNode();

        List<ItemNode> itemNodes = headerResource.entrySet().stream()
                .map(k -> new ItemNode(k.getKey(), k.getValue())).collect(Collectors.toList());

        headerNode.setItems(itemNodes);

        return headerNode;
    }

    public OperatorNode buildOperatorEntity(List<MethodResource> methodResources,
                                            List<OperatorResource> operatorResources,
                                            String invokerName){
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

        operatorResources.remove(operatorResource);

        OperatorNode operatorNode = new OperatorNode();
        operatorNode.setId(operatorResource.getNodeId());
        operatorNode.setIndex(operatorResource.getIndex());
        operatorNode.setType(operatorResource.getType());
        operatorNode.setOperand(operatorResource.getCondition().getRelationalOperator());
        operatorNode.setRightStatement(ConditionUtility.buildStringStatement(operatorResource.getCondition().getRightStatement()));
        operatorNode.setLeftStatement(ConditionUtility.buildStringStatement(operatorResource.getCondition().getLeftStatement()));

        if (i.length() < nextElement.length()){ // TODO: should be refactored. Invoker name initialization is not clear
            operatorNode.setBodyOperator(buildOperatorEntity(methodResources, operatorResources, invokerName));
            operatorNode.setBodyFunction(buildMethodEntity(methodResources, operatorResources, invokerName));
        }

        List<String> restIndex = getIndexes(methodResources, operatorResources);
        if (restIndex.isEmpty()){
            nextElement = "";
        } else {
            nextElement = restIndex.get(0);
        }

        if (i.length() == nextElement.length()){
            operatorNode.setNextOperator(buildOperatorEntity(methodResources, operatorResources, invokerName));
            operatorNode.setNextFunction(buildMethodEntity(methodResources, operatorResources, invokerName));
        }

        return operatorNode;
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
}
