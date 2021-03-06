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

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.elasticsearch.logs.entity.LogMessage;
import com.becon.opencelium.backend.elasticsearch.logs.service.LogMessageServiceImp;
import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.MethodNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.VariableNodeServiceImp;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.net.URI;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ConnectorExecutor {

    private Invoker invoker;

    private InvokerServiceImp invokerService;
    private RestTemplate restTemplate;
    private ExecutionContainer executionContainer;
    private FieldNodeServiceImp fieldNodeService;
    private MethodNodeServiceImp methodNodeServiceImp;
    private ConnectorServiceImp connectorService;
    private LogMessageServiceImp logMessageService;
    private VariableNodeServiceImp statementNodeService;
    private boolean debugMode = false;

    public ConnectorExecutor(InvokerServiceImp invokerService, ExecutionContainer executionContainer,
                             FieldNodeServiceImp fieldNodeService, MethodNodeServiceImp methodNodeServiceImp,
                             ConnectorServiceImp connectorService, LogMessageServiceImp logMessageService,
                             VariableNodeServiceImp statementNodeService) {
        this.invokerService = invokerService;
        this.executionContainer = executionContainer;
        this.fieldNodeService = fieldNodeService;
        this.methodNodeServiceImp = methodNodeServiceImp;
        this.connectorService = connectorService;
        this.logMessageService = logMessageService;
        this.statementNodeService = statementNodeService;
    }

    public void start(ConnectorNode connectorNode, Connector currentConnector, Connector supportConnector,
                      String conn, boolean debugMode){
        this.debugMode = debugMode;
        this.restTemplate = createRestTemplate(currentConnector);
        this.invoker = invokerService.findByName(currentConnector.getInvoker());
        List<RequestData> requestData = connectorService.buildRequestData(currentConnector);
        List<RequestData> supportRequestData = connectorService.buildRequestData(supportConnector);
        executionContainer.setConn(conn);
        executionContainer.setSupportRequestData(supportRequestData);
        executionContainer.setRequestData(requestData);
        executionContainer.setLoopIndex(new LinkedHashMap<>());

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
            if (debugMode) System.out.println("Response : " + responseEntity.getBody());

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

                Integer loopIndex = 0;
                if (!arrayContainer.isEmpty()) {
                    loopIndex = loopStack.getOrDefault(arrayContainer.get(sizeArrayContainer - 1), 0);
                }

                responseContainer.put(loopIndex,responseEntity.getBody());

                messageContainer.setMethodKey(methodNode.getColor());
                messageContainer.setResponseFormat(methodNode.getResponseNode().getSuccess().getBody().getFormat());
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

        if (debugMode) {
            System.out.println("============================================================");
            System.out.println("Function: " + methodNode.getName() + " -- color: " + methodNode.getColor());
        }

        HttpMethod method = getMethod(methodNode); // done
        if (debugMode) System.out.println("Method: " + method.name());

        String url = buildUrl(methodNode); // done
        if (debugMode) System.out.println("URL: " + url);

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
            if(debugMode) System.err.println(e.getMessage());
        }


        HttpHeaders header = buildHeader(functionInvoker); // done
        if (debugMode) System.out.println("Header: " + header.toString());
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
            if(debugMode) System.err.println(e.getMessage());
        }

        String body = buildBody(methodNode.getRequestNode().getBodyNode()); // done

        if (debugMode) System.out.println("Body: " + body);
        if (debugMode) System.out.println("============================================================");
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
            if (debugMode) System.err.println(e.getMessage());
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
        if (invoker.getName().equals("CheckMK") && body != null && !body.isEmpty()){
            if (contentType.equals("application/x-www-form-urlencoded")) {
                formData.add("request", body);
                data = formData;
            } else {
                data = body;
            }
            if (debugMode) System.out.println("Inside CheckMK body: " + data);
        }

        // TODO: Changed string to object in httpEntity;
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
        if (body.equals("null")){
            httpEntity = new HttpEntity <Object> (header);
        }

        URI uri;
        try {
            uri = new URI(url);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
//        f (invoker.getName().equalsIgnoreCase("igel")){
//            restTemplate = getRestTemplate();
//        }i
        ResponseEntity<String> response = restTemplate.exchange(uri, method ,httpEntity, String.class);
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
            if (debugMode) System.err.println(e.getMessage());
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
            if (debugMode) System.err.println(e.getMessage());
        }
        return response;
    }

    private CloseableHttpClient getDisabledHttpsClient() {

        try {
            TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                        public void checkClientTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                        public void checkServerTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                    }
            };
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            CloseableHttpClient httpClient = HttpClients.custom()
                    .setSSLContext(sslContext)
                    .setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                    .build();



            return httpClient;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
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
        BodyNode b = methodNode.getRequestNode().getBodyNode();
        String format = b == null ? "json" : b.getFormat();
        String requiredField;
        String refRegex = "\\{(.*?)\\}";
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(endpoint);
        if(matcher.find()) {
            endpoint = replaceRefValue(endpoint, format);
        }
        return endpoint;
    }

    public String buildBody(BodyNode bodyNode){
        if (bodyNode == null){
            return "null";
        }
        Map<String, Object> fields = replaceValues(bodyNode.getFields());
//        body = fieldNodeService.deleteEmptyFields(body); // user should determine which fields should be in body.
        Object content = null;
        if (bodyNode.getType() != null && bodyNode.getType().equals("array")){
            List<Object> c = new ArrayList<>();
            c.add(fields);
            content = c;
        } else {
            content = fields;
        }
        String result = "";
        try {
            switch (bodyNode.getFormat()) {
                case "xml" :
                    Document document = createDocument();
                    Xml transformer = new Xml(document);
                    result = transformer.toString(content);
                    break;
                case "json":
                    result = new ObjectMapper().writeValueAsString(content);
                    break;
                default:
            }
        } catch (JsonProcessingException e){
            throw new RuntimeException(e);
        }
        return result;
    }

    private Document createDocument() {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        try {
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.newDocument();
        }catch (ParserConfigurationException parserException) {
            parserException.printStackTrace();
            throw new RuntimeException(parserException);
        }
    }

    public HttpHeaders buildHeader(FunctionInvoker functionInvoker){
        HttpHeaders httpHeaders = new HttpHeaders();
        final Map<String, String> header = functionInvoker.getRequest().getHeader();
        Map<String, String> headerItem = new HashMap<>();

        Body b = functionInvoker.getRequest().getBody();
        String format = b == null ? "json" : b.getFormat();


        header.forEach((k,v) -> {
            String refRegex = "\\{(.*?)\\}";
            Pattern pattern = Pattern.compile(refRegex);
            Matcher matcher = pattern.matcher(v);
            if(matcher.find()) {
                String exp = replaceRefValue(v, format);
                headerItem.put(k, exp);
                return;
            }
            headerItem.put(k, v);
        });
        httpHeaders.setAll(headerItem);
        return httpHeaders;
    }

    private static String incrementIndexes(String path){
        String result = "";
        List<String> pathParts = Arrays.asList( path.split("\\."));

        for (String part : pathParts) {
            final Pattern pattern = Pattern.compile(RegExpression.arrayWithNumberIndex, Pattern.MULTILINE);
            final Matcher matcher = pattern.matcher(part);

            int intIndex = 0;
            while (matcher.find()) {
                String index = matcher.group(1);
                intIndex = Integer.parseInt(index) + 1;
                part = part.replaceFirst("\\[" + index + "\\]", "[" + intIndex + "]");
            }

            if (!result.isEmpty()) {
                result = result + "." + part;
            } else {
                result = result + part;
            }
        }
        return result;
    }

    private String replaceRefValue(String url, String format) {
        String result = url;
//        String refRegex = RegExpression.requiredData;
        String refRegex = "(\\{(.*?)\\}|\\$\\{(.*?)\\})";
        String refResRegex = RegExpression.responsePointer;
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(url);
        List<String> refParts = new ArrayList<>();
        while (matcher.find()){
            refParts.add(matcher.group());
        }

        for (String pointer : refParts) {
            if (pointer.matches(refResRegex)) {
                String ref = pointer.replace("{%", "").replace("%}", "");
                if (format.equals("xml")) {
                    ref = incrementIndexes(ref);
                }
                Object responseValue = executionContainer.getValueFromResponseData(ref);
                String value = "";
                if (responseValue instanceof Integer) {
                    value = Integer.toString((int) responseValue);
                } else if(responseValue instanceof Double) {
                    value = Double.toString((double) responseValue);
                }
                else {
                    value = executionContainer.getValueFromResponseData(ref).toString();
                }

                result = result.replace(pointer, value);
            } else if(pointer.matches("\\$\\{(.*?)\\}")) {
                String value = executionContainer.getValueWebhookParams(pointer).toString();
                result = result.replace(pointer, value);
            } else {
                // replace from request data
                String v = executionContainer.getValueFromRequestData(pointer);
                result = result.replace(pointer, v);
            }
        }

        return result;
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
            if ((f.getValue() != null) && !f.getValue().contains("${") && f.getValue().contains("{") && f.getValue().contains("}") && !isObject){

                item.put (f.getName(), executionContainer.getValueFromRequestData(f.getValue()));
                return;
            }

            // from enhancement
            if (fieldNodeService.hasEnhancement(f.getId())){
                MethodNode methodNode = methodNodeServiceImp.getByFieldNodeId(f.getId())
                        .orElseThrow(() -> new RuntimeException("Method not found for field: " + f.getId()));
                item.put(f.getName(), executionContainer.getValueFromEnhancementData(f));
                return;
            }

            // from response data;
            if ((f.getValue()!=null) && !fieldNodeService.hasEnhancement(f.getId()) && fieldNodeService.hasReference(f.getValue())){
                item.put(f.getName(), executionContainer.getValueFromResponseData(f.getValue()));
                return;
            }

            // from url query data;
            if ((f.getValue()!=null) && !fieldNodeService.hasEnhancement(f.getId()) && fieldNodeService.hasQueryParams(f.getValue())){
                item.put(f.getName(), executionContainer.getValueWebhookParams(f.getValue()));
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
    private void executeDecisionStatement(StatementNode statementNode) {
        if (statementNode == null){
            return;
        }

        switch (statementNode.getType()){
            case "if":
                executeIfStatement(statementNode);
                break;
            case "loop":
                executeLoopStatement(statementNode);
                break;
            default:
        }
        executeMethod(statementNode.getNextFunction());
        executeDecisionStatement(statementNode.getNextOperator());
    }

    private void executeIfStatement(StatementNode ifStatement){
        if (debugMode) System.out.println("=============== " + ifStatement.getOperand() + " ================= " + ifStatement.getIndex() );
        OperatorAbstractFactory factory = new OperatorAbstractFactory();
        Operator operator = factory.generateFactory(OperatorType.COMPARISON).getOperator(ifStatement.getOperand());
        Object leftVariable = getValue(ifStatement.getLeftStatementVariable(), "");

        if(leftVariable != null && debugMode){
            System.out.println("Left Statement: " + leftVariable.toString());
        }

        String ref = statementNodeService.convertToRef(ifStatement.getLeftStatementVariable());
        Object rightStatement = null;
        if (ifStatement.getOperand().equals("AllowList") || ifStatement.getOperand().equals("DenyList") ) {
            rightStatement = ifStatement.getRightStatementVariable().getFiled().split(",");
        } else {
            rightStatement = getValue(ifStatement.getRightStatementVariable(), ref);
        }

        if (rightStatement != null && debugMode){
            if (rightStatement.getClass().isArray()) {
                System.out.println("Right Statement: " + Arrays.toString((String[])rightStatement));
            } else {
                System.out.println("Right Statement: " + rightStatement.toString());
            }

        }
//        if (leftVariable instanceof NodeList)
        boolean result = operator.compare(leftVariable, rightStatement);
        if (ifStatement.getOperand().equals("DenyList")) {
            result = !result;
        }
        if (result){
            executeMethod(ifStatement.getBodyFunction());
            executeDecisionStatement(ifStatement.getBodyOperator());
        }
    }

    private Object getValue(StatementVariable statementVariable, String leftVariableRef) {
        if (statementVariable == null) {
            return null;
        }

        if (statementVariable.getRightPropertyValue() != null && !statementVariable.getRightPropertyValue().isEmpty()) {
            List<Object> result = new ArrayList<>();
            String ref = statementNodeService.convertToRef(statementVariable);
            String rightPropertyValueRef = leftVariableRef + "." + statementVariable.getRightPropertyValue();
            Object value;
            if (FieldNodeServiceImp.hasReference(ref)){
                value = executionContainer.getValueFromResponseData(ref);
                result.add(value);
            } else {
                if (FieldNodeServiceImp.hasQueryParams(statementVariable.getFiled())) {
                    result.add(executionContainer.getValueWebhookParams(statementVariable.getFiled()));
                } else {
                    result.add(statementVariable.getFiled());
                }
            }

            value = executionContainer.getValueFromResponseData(rightPropertyValueRef);
            result.add(value);
            return result;
        }

        String ref = statementNodeService.convertToRef(statementVariable);
        if (!FieldNodeServiceImp.hasReference(ref)){
            if (FieldNodeServiceImp.hasQueryParams(statementVariable.getFiled())) {
                return executionContainer.getValueWebhookParams(statementVariable.getFiled());
            } else {
                return statementVariable.getFiled();
            }
        }
        return executionContainer.getValueFromResponseData(ref);
    }

    private void executeLoopStatement(StatementNode statementNode){
        StatementVariable leftStatement = statementNode.getLeftStatementVariable();
        String methodKey = leftStatement.getColor();
        String condition = leftStatement.getColor() + ".(" + leftStatement.getType() + ")." + leftStatement.getFiled();
//        // TODO: Need to rework for "request" types too.
//        String exchangeType = ConditionUtility.getExchangeType(condition);

        Map<String, Integer> loopIndex = executionContainer.getLoopIndex();
        MessageContainer message = executionContainer.getResponseData().stream()
                .filter(m -> m.getMethodKey().equals(methodKey))
                .findFirst()
                .orElse(null);
        List<Object> array =
                (List<Object>) message.getValue(condition, loopIndex);

        if (debugMode) System.out.println("============================= LOOP ======================== " + statementNode.getIndex());
        String arr = ConditionUtility.getLastArray(condition);;
        for (int i = 0; i < array.size(); i++) {
            if (debugMode) System.out.println("Loop " + condition + "-------- index : " + i);
            loopIndex.put(arr, i);
            executeMethod(statementNode.getBodyFunction());
            executeDecisionStatement(statementNode.getBodyOperator());
        }
        if (loopIndex.containsKey(arr)){
            loopIndex.remove(arr);
        }
        executeMethod(statementNode.getNextFunction());
        executeDecisionStatement(statementNode.getNextOperator());
    }

    private RestTemplate createRestTemplate(Connector connector) {
        RestTemplate restTemplate = new RestTemplate();
        HttpComponentsClientHttpRequestFactory requestFactory;
        if (!connector.isSslCert()){
//            ClientHttpRequestFactory requestFactory =
//                    new HttpComponentsClientHttpRequestFactory(getDisabledHttpsClient());
            requestFactory =  new HttpComponentsClientHttpRequestFactory(getDisabledHttpsClient());
        } else {
            requestFactory = new HttpComponentsClientHttpRequestFactory();
        }

        int timeout = connector.getTimeout();
        if (timeout > 0) {
            requestFactory.setConnectTimeout(timeout);
            requestFactory.setReadTimeout(timeout);
        }

        restTemplate.setRequestFactory(requestFactory);

        return restTemplate;
    }
}
