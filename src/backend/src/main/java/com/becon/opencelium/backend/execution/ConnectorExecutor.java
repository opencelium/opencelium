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

package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.elasticsearch.logs.entity.LogMessage;
import com.becon.opencelium.backend.elasticsearch.logs.service.LogMessageServiceImp;
import com.becon.opencelium.backend.factory.OperatorFactory;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.BodyNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.MethodNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.StatementNodeServiceImp;
import com.becon.opencelium.backend.operator.Operator;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ConnectorExecutor {

    private Invoker invoker;

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ExecutionContainer executionContainer;

    @Autowired
    private BodyNodeServiceImp bodyNodeService;

    @Autowired
    private FieldNodeServiceImp fieldNodeService;

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private LogMessageServiceImp logMessageService;

    @Autowired
    private StatementNodeServiceImp statementNodeService;

    public void start(ConnectorNode connectorNode, Connector connector){
        this.invoker = invokerService.findByName(connector.getInvoker());
        List<RequestData> requestData = connectorService.buildRequestData(connector);
        executionContainer.setRequestData(requestData);
        executionContainer.setLoopIndex(new HashMap<>());
        executeMethod(connectorNode.getStartMethod());
        executeDecisionStatement(connectorNode.getStartOperator());
    }

    private void executeMethod(MethodNode methodNode) {
        if (methodNode == null){
            return;
        }

        try {
// ================================= remove =========================================
            MessageContainer messageContainer;
            HashMap<Integer, String> responseContainer;
            List<String> arrayContainer = new ArrayList<>();
            Map<String, Integer> loopStack = executionContainer.getLoopIndex();
            if (!loopStack.isEmpty()) {
                arrayContainer = new ArrayList<>(loopStack.keySet());
            }
// ==================================================================================
            ResponseEntity<String> responseEntity = sendRequest(methodNode);
            System.out.println("Response : " + responseEntity.getBody());

            messageContainer = executionContainer.getResponseData().stream()
                    .filter(m -> m.getMethodKey().equals(methodNode.getColor()))
                    .findFirst()
                    .orElse(null);

            int sizeArrayContainer = arrayContainer.size();
            if(messageContainer != null){
                // adding new response message into existing data.
                HashMap<Integer, String> list = messageContainer.getData();
                list.put(loopStack.get(arrayContainer.get(sizeArrayContainer - 1)),responseEntity.getBody());
                messageContainer.setLoopingArrays(arrayContainer);
            }
            else {
                messageContainer = new MessageContainer();
                responseContainer = new HashMap<>();
                Integer loopIndex = loopStack.get(arrayContainer);
                if(loopIndex == null){
                    loopIndex = 0;
                }
                responseContainer.put(loopIndex,responseEntity.getBody());

                messageContainer.setMethodKey(methodNode.getColor());
                messageContainer.setExchangeType("response");
                messageContainer.setResult("success");
//                if (responseHasError(responseEntity)){
//                    messageContainer.setResult("fail");
//                }
                messageContainer.setLoopingArrays(arrayContainer);
                messageContainer.setData(responseContainer);

                List<MessageContainer> list = executionContainer.getResponseData();
                list.add(messageContainer);
            }


        } catch (Exception e){
            e.printStackTrace();
            //TODO: if error occurred write in logs
        }

        executeMethod(methodNode.getNextFunction());
        executeDecisionStatement(methodNode.getNextOperator());
    }

    private ResponseEntity<String> sendRequest(MethodNode methodNode){
        FunctionInvoker functionInvoker = invoker.getOperations().stream()
                .filter(m -> m.getName().equals(methodNode.getName())).findFirst()
                .orElseThrow(() -> new RuntimeException("Method not found in Invoker"));
        String taId = executionContainer.getTaId();

        System.out.println("============================================================");
        System.out.println("Function: " + methodNode.getName());

        HttpMethod method = getMethod(methodNode); // done
        System.out.println("Method: " + method.name());

        String url = buildUrl(methodNode); // done
        System.out.println("URL: " + url);

        LogMessage logMessage = LogMessageServiceImp.LogBuilder.newInstance()
                .setTaId(taId)
                .setOrderId(executionContainer.getOrder())
                .setMethod(methodNode.getName())
                .setExchange("REQUEST")
                .setMethodPart("URL")
                .setMessage(url)
                .build();
        try {
            logMessageService.save(logMessage);
        } catch (Exception e){
            System.err.println(e.getMessage());
        }


        HttpHeaders header = buildHeader(functionInvoker); // done
        System.out.println("Header: " + header.toString());
        logMessage = LogMessageServiceImp.LogBuilder.newInstance()
                .setTaId(taId)
                .setOrderId(executionContainer.getOrder())
                .setMethod(methodNode.getName())
                .setExchange("REQUEST")
                .setMethodPart("HEADER")
                .setMessage(header.toString())
                .build();
        try {
            logMessageService.save(logMessage);
        } catch (Exception e){
            System.err.println(e.getMessage());
        }

        String body = buildBody(methodNode.getRequestNode().getBodyNode()); // done

        System.out.println("Body: " + body);
        System.out.println("============================================================");
        logMessage = LogMessageServiceImp.LogBuilder.newInstance()
                .setTaId(taId)
                .setOrderId(executionContainer.getOrder())
                .setMethod(methodNode.getName())
                .setExchange("REQUEST")
                .setMethodPart("BODY")
                .setMessage(body)
                .build();
        try {
            logMessageService.save(logMessage);
        } catch (Exception e){
            System.err.println(e.getMessage());
        }

        // TODO: added application/x-www-form-urlencoded support: need to refactor.
        Object data;
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        String contentType = header.get("Content-Type") != null ? header.get("Content-Type").get(0) : null;
        if (contentType != null && header.containsKey("Content-Type")
                    && contentType.equals("application/x-www-form-urlencoded")
                    && !invoker.getName().equals("CheckMK")){
            try {
                HashMap<String, Object> mapData = new ObjectMapper().readValue(body, HashMap.class);
                mapData.forEach(formData::add);
                data = formData;
            } catch (Exception e){
                throw new RuntimeException(e);
            }
        } else {
            data = body;
        }

        // TODO: works only for CheckMk. Should be deleted in future.
//        if (invoker.getName().equals("CheckMK")){
//            formData.add("request", body);
//            data = formData;
//        }

        // TODO: Changed string to object in httpEntity;
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
        if (body.equals("null")){
            httpEntity = new HttpEntity <Object> (header);
        }

        ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
        logMessage = LogMessageServiceImp.LogBuilder.newInstance()
                .setTaId(taId)
                .setOrderId(executionContainer.getOrder())
                .setMethod(methodNode.getName())
                .setExchange("RESPONSE")
                .setMethodPart("HEADER")
                .setMessage(response.getHeaders().toString())
                .build();
        try {
            logMessageService.save(logMessage);
        } catch (Exception e){
            System.err.println(e.getMessage());
        }

        logMessage = LogMessageServiceImp.LogBuilder.newInstance()
                .setTaId(taId)
                .setOrderId(executionContainer.getOrder())
                .setMethod(methodNode.getName())
                .setExchange("RESPONSE")
                .setMethodPart("BODY")
                .setMessage(response.getBody())
                .build();
        try {
            logMessageService.save(logMessage);
        } catch (Exception e){
            System.err.println(e.getMessage());
        }
        return response;
    }

    private HttpMethod getMethod(MethodNode methodNode){
        HttpMethod httpMethodType;
        switch (methodNode.getRequestNode().getMethod()){
            case "POST":
                httpMethodType = HttpMethod.POST;
                break;
            case "DELETE":
                httpMethodType = HttpMethod.DELETE;
                break;
            case "PUT":
                httpMethodType = HttpMethod.PUT;
                break;
            case "GET":
                httpMethodType = HttpMethod.GET;
                break;
            default:
                throw new RuntimeException("Http method not found");
        }
        return httpMethodType;
    }

    public String buildUrl(MethodNode methodNode){
        String endpoint = methodNode.getRequestNode().getEndpoint();

        // replace from request data
        for (RequestData data : executionContainer.getRequestData()) {
            String field = "{" + data.getField() + "}";// TODO: should be regular expression
            if (endpoint.contains(field)){
                endpoint = endpoint.replace(field,data.getValue());
            }
        }

        String refRegex = "\\{%(.*?)%\\}";
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(endpoint);

        List<String> refParts = new ArrayList<>();
        while (matcher.find()){
            refParts.add(matcher.group());
        }

        for (String part : refParts) {
            String ref = part.replace("{%", "").replace("%}", "");
            String value = (String) executionContainer.getValueFromResponseData(ref);
            endpoint = endpoint.replace(part, value);
         }

//        endpoint = endpoint.replace(" ", "%20"); // In OpenMS url could name with whitespace
        return endpoint;
    }

    public String buildBody(BodyNode bodyNode){
        if (bodyNode == null){
            return "null";
        }
        Map<String, Object> body = replaceValues(bodyNode.getFields());
//        body = fieldNodeService.deleteEmptyFields(body); // user should determine which fields should be in body.
        String result = "";
        try {
            result =  new ObjectMapper().writeValueAsString(body);
        } catch (JsonProcessingException e){
            throw new RuntimeException(e);
        }
        return result;
    }

    public HttpHeaders buildHeader(FunctionInvoker functionInvoker){
        HttpHeaders httpHeaders = new HttpHeaders();
        final Map<String, String> header = functionInvoker.getRequest().getHeader();
        Map<String, String> headerItem = new HashMap<>();

        header.forEach((k,v) -> {
            String requiredField;
            if (v.contains("{") && v.contains("}")){
                String curlyValue = "";
                for (RequestData data : executionContainer.getRequestData()) {
                    String field = "{" + data.getField() + "}";// TODO: should be regular expression
                    curlyValue = v;
                    if (v.contains(field)){
                        curlyValue = curlyValue.replace(field,data.getValue());
                    }
                }
                requiredField = curlyValue;
//                String value = executionContainer.getRequestData().stream()
//                        .filter(r -> r.getField().equals(requiredField))
//                        .map(RequestData::getValue).findFirst().get();
                headerItem.put(k, requiredField);
                return;
            }
            headerItem.put(k, v);
        });
        httpHeaders.setAll(headerItem);
        return httpHeaders;
    }

    private boolean responseHasError(ResponseEntity<String> responseEntity){

        return true;
    }

    private Map<String, Object> replaceValues(List<FieldNode> fieldNodes){
        Map<String, Object> item = new HashMap<>();
        fieldNodes.forEach(f -> {
            boolean isObject = f.getType().equals("object");
            boolean isArray = f.getType().equals("array");

            if ((f.getValue() == null || f.getValue().equals("")) && (!isObject && !isArray)){
                return;
            }

            // replace from request_data
            if ((f.getValue() != null) && f.getValue().contains("{") && f.getValue().contains("}") && !isObject){
                item.put (f.getName(), executionContainer.getValueFromRequestData(f.getValue()));
                return;
            }

            // from enhancement
            if (fieldNodeService.hasEnhancement(f.getId())){
                MethodNode methodNode = methodNodeServiceImp.getByFieldNodeId(f.getId())
                        .orElseThrow(() -> new RuntimeException("Method not found for field: " + f.getId()));
                String path = fieldNodeService.getPath(methodNode, f);
                item.put(f.getName(), executionContainer.getValueFromEnhancementData(f));
                return;
            }

            // from response data;
            if ((f.getValue()!=null) && !fieldNodeService.hasEnhancement(f.getId()) && fieldNodeService.hasReference(f.getValue())){
                item.put(f.getName(), executionContainer.getValueFromResponseData(f.getValue()));
                return;
            }

            if (f.getChild() != null){
                Object value = new Object();
                if (f.getType().equals("array")){
                    value = Collections.singletonList(replaceValues(f.getChild()));
                } else {
                    value = replaceValues(f.getChild());
                }
                item.put(f.getName(), value);
                return;
            }

            if (isArray && (f.getValue() instanceof String)){
                ArrayList<String> value;
                if (f.getValue().length() == 0){
                    value = new ArrayList<>();
                } else {
                    String stringedArray = f.getValue().replace("[", "").replace("]","");
                    String[] elements = stringedArray.split(",");
                    value = new ArrayList<>(Arrays.asList(elements));
                }

                item.put(f.getName(), value);
                return;
            }

            item.put(f.getName(), f.getValue());
        });

        return item;
    }
// ======================================= OPERATOR =================================================== //
    private void executeDecisionStatement(OperatorNode operatorNode) {
        if (operatorNode == null){
            return;
        }

        switch (operatorNode.getType()){
            case "if":
                executeIfStatement(operatorNode);
                break;
            case "loop":
                executeLoopStatement(operatorNode);
                break;
            default:
        }
        executeMethod(operatorNode.getNextFunction());
        executeDecisionStatement(operatorNode.getNextOperator());
    }

    private void executeIfStatement(OperatorNode ifStatement){
        OperatorFactory operatorFactory = new OperatorFactory();
        Operator operator = operatorFactory.getOperator(ifStatement.getOperand());
        Object leftStatement = getValue(ifStatement.getLeftStatement(), "");
        System.out.println("=============== " + ifStatement.getOperand() + " =================");
        System.out.println("Left Statement: " + leftStatement.toString());

        String ref = statementNodeService.convertToRef(ifStatement.getLeftStatement());
        Object rightStatement = getValue(ifStatement.getRightStatement(), ref);
        if (rightStatement != null){
            System.out.println("Right Statement: " + rightStatement.toString());
        }

        if (operator.compare(leftStatement, rightStatement)){
            executeMethod(ifStatement.getBodyFunction());
            executeDecisionStatement(ifStatement.getBodyOperator());
        }
    }

    private Object getValue(StatementNode statementNode, String leftStatement) {
        if (statementNode == null) {
            return null;
        }

        if (statementNode.getRightPropertyValue() != null && !statementNode.getRightPropertyValue().isEmpty()) {
            List<Object> result = new ArrayList<>();
            String ref = statementNodeService.convertToRef(statementNode);
            String rightPropertyValueRef = leftStatement + "." + statementNode.getRightPropertyValue();
            Object value;
            if (fieldNodeService.hasReference(ref)){
                value = executionContainer.getValueFromResponseData(ref);
                result.add(value);
            } else {
                result.add(statementNode.getFiled());
            }

            value = executionContainer.getValueFromResponseData(rightPropertyValueRef);
            result.add(value);
            return result;
        }

        String ref = statementNodeService.convertToRef(statementNode);
        if (!fieldNodeService.hasReference(ref)){
            return statementNode.getFiled();
        }
        return executionContainer.getValueFromResponseData(ref);
    }

    private void executeLoopStatement(OperatorNode operatorNode){
        StatementNode leftStatement = operatorNode.getLeftStatement();
        String methodKey = leftStatement.getColor();
        String condition = leftStatement.getColor() + ".(" + leftStatement.getType() + ")." + leftStatement.getFiled();
//        // TODO: Need to rework for "request" types too.
//        String exchangeType = ConditionUtility.getExchangeType(condition);

        Map<String, Integer> loopStack = executionContainer.getLoopIndex();
        MessageContainer message = executionContainer.getResponseData().stream()
                .filter(m -> m.getMethodKey().equals(methodKey))
                .findFirst()
                .orElse(null);
        List<Map<String, Object>> array =
                (List<Map<String, Object>>) message.getValue(condition, loopStack);

        for (int i = 0; i < array.size(); i++) {
            System.out.println("Loop " + condition + "[" + i + "]");
            loopStack.put(condition, i);
            executeMethod(operatorNode.getBodyFunction());
            executeDecisionStatement(operatorNode.getBodyOperator());
        }

        if (loopStack.containsKey(condition)){
            loopStack.remove(condition);
        }
        executeMethod(operatorNode.getNextFunction());
        executeDecisionStatement(operatorNode.getNextOperator());
    }
}
