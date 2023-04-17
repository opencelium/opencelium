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
import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.OperatorType;
import com.becon.opencelium.backend.execution.log.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.log.msg.MethodData;
import com.becon.opencelium.backend.execution.statement.operator.factory.OperatorAbstractFactory;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.logger.OcLogger;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.MethodNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.VariableNodeServiceImp;
import com.becon.opencelium.backend.execution.statement.operator.Operator;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.*;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.execution.ExecutionContainer.buildSeqIndexes;

public class ConnectorExecutor {



    private Invoker invoker;

    private final InvokerServiceImp invokerService;
    private RestTemplate restTemplate;
    private final ExecutionContainer executionContainer;
    private final FieldNodeServiceImp fieldNodeService;
    private final MethodNodeServiceImp methodNodeServiceImp;
    private final ConnectorServiceImp connectorService;
    private final VariableNodeServiceImp statementNodeService;
    private final OcLogger<ExecutionLog> logger;

    public ConnectorExecutor(InvokerServiceImp invokerService, ExecutionContainer executionContainer,
                             FieldNodeServiceImp fieldNodeService, MethodNodeServiceImp methodNodeServiceImp,
                             ConnectorServiceImp connectorService, VariableNodeServiceImp statementNodeService,
                             OcLogger<ExecutionLog> logger) {
        this.invokerService = invokerService;
        this.executionContainer = executionContainer;
        this.fieldNodeService = fieldNodeService;
        this.methodNodeServiceImp = methodNodeServiceImp;
        this.connectorService = connectorService;
        this.statementNodeService = statementNodeService;
        this.logger = logger;
    }

    public void start(ConnectorNode connectorNode, Connector currentConnector, Connector supportConnector,
                      String conn) {
        this.restTemplate = createRestTemplate(currentConnector);
        this.invoker = invokerService.findByName(currentConnector.getInvoker());
        List<RequestData> requestData = connectorService.buildRequestData(currentConnector);
        List<RequestData> supportRequestData = connectorService.buildRequestData(supportConnector);
        executionContainer.setConn(conn);
        executionContainer.setSupportRequestData(supportRequestData);
        executionContainer.setRequestData(requestData);
        executionContainer.setLoopIterators(new LinkedHashMap<>());

        logger.getLogEntity().setType(LogType.INFO);
        try {
            executeMethod(connectorNode.getStartMethod());
            executeDecisionStatement(connectorNode.getStartOperator());
        } catch (Exception e) {
            logger.logAndSend(e, LogType.ERROR);
        }
    }

    private void executeMethod(MethodNode methodNode) throws Exception {
        if (methodNode == null){
            return;
        }
// ================================= remove =========================================
        MethodResponse methodResponse;
        HashMap<String, String> responseContainer;
        Map<String, Integer> loopsWithCurrIndex = executionContainer.getLoopIterators();
        logger.getLogEntity().setMethodData(new MethodData(methodNode.getColor()));
// ==================================================================================
        ResponseEntity<String> responseEntity = sendRequest(methodNode);

        methodResponse = executionContainer.getMethodResponses().stream()
                .filter(m -> m.getMethodKey().equals(methodNode.getColor()))
                .findFirst()
                .orElse(null);

        String responseIndex = buildSeqIndexes(loopsWithCurrIndex);
        if(methodResponse != null){
            if(methodResponse.getData().containsKey("null")) {
                responseIndex = null;
            }
            // adding new response message into existing data.
            methodResponse.getData()
                    .put(responseIndex, responseEntity.getBody());
        }
        else {
            methodResponse = new MethodResponse();
            responseContainer = new LinkedHashMap<>();
            responseContainer.put(responseIndex,responseEntity.getBody());

            methodResponse.setMethodKey(methodNode.getColor());
            methodResponse.setResponseFormat(methodNode.getResponseNode().getSuccess().getBody().getFormat());
            methodResponse.setExchangeType("response");
            methodResponse.setResult("success");
            methodResponse.setData(responseContainer);

            List<MethodResponse> list = executionContainer.getMethodResponses();
            list.add(methodResponse);
        }
        logger.getLogEntity().setMethodData(null);
        executeMethod(methodNode.getNextFunction());
        executeDecisionStatement(methodNode.getNextOperator());
    }



    private ResponseEntity<String> sendRequest(MethodNode methodNode) throws URISyntaxException{
        String nextFunctionIndex = methodNode.getNextFunction() != null ? methodNode.getNextFunction().getIndex() : "null";
        String nextOperatorIndex = methodNode.getNextOperator() != null ? methodNode.getNextOperator().getIndex() : "null";
        logger.logAndSend("============================================================================");
        logger.logAndSend("Function: " + methodNode.getName()
                + " -- next function: " + nextFunctionIndex
                + " -- next operator: " + nextOperatorIndex
                + " -- index: " + methodNode.getIndex()
        );

        FunctionInvoker functionInvoker = invoker.getOperations().stream()
                .filter(m -> m.getName().equals(methodNode.getName())).findFirst()
                .orElseThrow(() -> new RuntimeException("Method not found in Invoker"));

        HttpMethod method = getMethod(methodNode); // done
        URI uri = buildUrl(methodNode); // done
        HttpHeaders header = buildHeader(functionInvoker); // done
        String body = buildBody(methodNode.getRequestNode().getBodyNode()); // done

        logger.logAndSend("============================================================");

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

            logger.logAndSend("Inside CheckMK body: " + data);
        }

        // TODO: Changed string to object in httpEntity;
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
        if (body.equals("null")){
            httpEntity = new HttpEntity <Object> (header);
        }

//        f (invoker.getName().equalsIgnoreCase("igel")){
//            restTemplate = getRestTemplate();
//        }i
        ResponseEntity responseEntity = InvokerRequestBuilder
                .convertToStringResponse(restTemplate.exchange(uri, method ,httpEntity, Object.class));
        logger.logAndSend("Response : " + responseEntity.getBody());
        return responseEntity;
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

        logger.logAndSend("Http Method: " + httpMethodType.name());
        return httpMethodType;
    }

    public URI buildUrl(MethodNode methodNode) throws URISyntaxException {
        String endpoint = methodNode.getRequestNode().getEndpoint();
        BodyNode b = methodNode.getRequestNode().getBodyNode();
        String format = b == null ? "json" : b.getFormat();
        String refRegex = "\\{(.*?)\\}";
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(endpoint);
        if(matcher.find()) {
            endpoint = replaceRefValue(endpoint, format);
        }
        endpoint = endpoint.replace(" ", "+");
        URI uri = new URI(endpoint);
        String strictlyEscapedQuery = StringUtils.replace(uri.getRawQuery(), "+", "%2B");
        uri = UriComponentsBuilder.fromUri(uri).replaceQuery(strictlyEscapedQuery).build(true).toUri();
        logger.logAndSend("URL: " + uri);
        return uri;
    }

    public String buildBody(BodyNode bodyNode){
        if (bodyNode == null){
            logger.logAndSend("Body: " + "null");
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
        logger.logAndSend("Body: " + result);
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
        logger.logAndSend("Header: " + httpHeaders.toString());
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

            if ((f.getValue() == null || f.getValue().equals("")) && (!isObject && !isArray)) {
//                item.put(f.getName(), f.getValue()); // uncomment if you want to add empty and null values to request
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
            if ((f.getValue()!=null) && !fieldNodeService.hasEnhancement(f.getId()) && FieldNodeServiceImp.hasReference(f.getValue())){
                item.put(f.getName(), executionContainer.getValueFromResponseData(f.getValue()));
                return;
            }
            // from url query data;
            if ((f.getValue()!=null) && !fieldNodeService.hasEnhancement(f.getId()) && fieldNodeService.hasQueryParams(f.getValue())){
                item.put(f.getName(), executionContainer.getValueWebhookParams(f.getValue()));
                return;
            }

            if (f.getChild() != null && !f.getChild().isEmpty()){
                Object value;
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
            Object value = getEmptyValueByType(f.getValue(), f.getType());
            item.put(f.getName(), value);
        });
        return item;
    }

    private static Object getEmptyValueByType(Object value, String type) {
        if (type.equals("string") || type.equals("plaintext")) {
            if (value instanceof HashMap<?,?> && ((HashMap<?,?>)value).isEmpty()) {
                return null;
            } else if (value instanceof List<?> && ((List<?>)value).isEmpty()) {
                return null;
            } else if (value instanceof String && ((String) value).isEmpty()) {
                return null;
            }
        }
        return value;
    }
// ======================================= OPERATOR =================================================== //
    private void executeDecisionStatement(StatementNode statementNode) throws Exception {
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

        String nextFunctionIndex = statementNode.getNextFunction() != null ? statementNode.getNextFunction().getIndex() : "null";
        String nextOperatorIndex = statementNode.getNextOperator() != null ? statementNode.getNextOperator().getIndex() : "null";
        logger.logAndSend("============================================================================");
        logger.logAndSend("Operator:"
                + " -- next function: " + nextFunctionIndex
                + " -- next operator: " + nextOperatorIndex
                + " -- type: " + statementNode.getType()
                + " -- index: " + statementNode.getIndex()
        );

        executeMethod(statementNode.getNextFunction());
        executeDecisionStatement(statementNode.getNextOperator());
    }

    private void executeIfStatement(StatementNode ifStatement) throws Exception{
        String nextFunctionIndex = ifStatement.getNextFunction() != null ? ifStatement.getNextFunction().getIndex() : "null";
        String nextOperatorIndex = ifStatement.getNextOperator() != null ? ifStatement.getNextOperator().getIndex() : "null";

        logger.logAndSend("============================================================================");
        logger.logAndSend("=============== " + ifStatement.getOperand() + " ================="
                + " -- next function: " + nextFunctionIndex
                + " -- next operator: " + nextOperatorIndex
                + " -- index: " + ifStatement.getIndex()
        );

        OperatorAbstractFactory factory = new OperatorAbstractFactory();
        Operator operator = factory.generateFactory(OperatorType.COMPARISON).getOperator(ifStatement.getOperand());
        Object leftVariable = getValue(ifStatement.getLeftStatementVariable(), "");

        if(leftVariable != null){
            logger.logAndSend("Left Statement: " + leftVariable);
        }

        String ref = statementNodeService.convertToRef(ifStatement.getLeftStatementVariable());
        Object rightStatement = null;
        if (ifStatement.getOperand().equals("AllowList") || ifStatement.getOperand().equals("DenyList") ) {
            rightStatement = ifStatement.getRightStatementVariable().getFiled()
                    .replace("\n", ",").split(",");
        } else {
            rightStatement = getValue(ifStatement.getRightStatementVariable(), ref);
        }

        if (rightStatement != null){
            if (rightStatement.getClass().isArray()) {
                logger.logAndSend("Right Statement: " + Arrays.toString((String[])rightStatement));
            } else {
                logger.logAndSend("Right Statement: " + rightStatement);
            }

        }
//        if (leftVariable instanceof NodeList)
        boolean result = operator.compare(leftVariable, rightStatement);
        if (ifStatement.getOperand().equals("DenyList")) {
            result = !result;
        }

        String msg = createOperatorResultMessage(result, ifStatement.getIndex());
        logger.logAndSend(msg);

        if (result){
            executeMethod(ifStatement.getBodyFunction());
            executeDecisionStatement(ifStatement.getBodyOperator());
        }
    }

    private String createOperatorResultMessage(boolean conditionResult, String executionIndexOrder) {
        String result = conditionResult ? "TRUE" : "FALSE";

        return "OPERATOR_RESULT: " + result + " -- index: " + executionIndexOrder;
    }

//    private String[] getArrayForAllowList(String s) {
//        String refRegex = "(\\s?(\"[\\w\\s]*\"|\\d*)\\s?(,|$)){16}";
//        Pattern pattern = Pattern.compile(refRegex);
//        Matcher matcher = pattern.matcher(s);
//
//        while (matcher.find()) {
//            return s.split(",");
//        }
//
//        return s.split("\n");
//    }

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

    private void executeLoopStatement(StatementNode statementNode) throws Exception{
        StatementVariable leftStatement = statementNode.getLeftStatementVariable();
        String methodKey = leftStatement.getColor();
        String condition = leftStatement.getColor() + ".(" + leftStatement.getType() + ")." + leftStatement.getFiled();
//        // TODO: Need to rework for "request" types too.
//        String exchangeType = ConditionUtility.getExchangeType(condition);

        // getting iterators of loops;
        Map<String, Integer> loopIterators = executionContainer.getLoopIterators();
        MethodResponse message = executionContainer.getMethodResponses().stream()
                .filter(m -> m.getMethodKey().equals(methodKey))
                .findFirst()
                .orElse(null);
        List<Object> array =
                (List<Object>) message.getValue(condition, loopIterators);

        logger.logAndSend("============================= LOOP ======================== ");
        logger.logAndSend(createLoopMsgForLog(array.isEmpty(), statementNode.getIndex()));

        for (int i = 0; i < array.size(); i++) {
            logger.logAndSend("Loop " + condition + "-------- index : " + i);

            loopIterators.put(statementNode.getIterator(), i);
            executeMethod(statementNode.getBodyFunction());
            executeDecisionStatement(statementNode.getBodyOperator());
        }
        loopIterators.remove(statementNode.getIterator());
        executeMethod(statementNode.getNextFunction());
        executeDecisionStatement(statementNode.getNextOperator());
    }

    private String createLoopMsgForLog(boolean isEmpty, String executionOrderIndex) {
        String loopSize = isEmpty ? "EMPTY" : "NOT_EMPTY";
        return  "LOOP_OPERATOR_RESULT: " + loopSize + " -- index: " + executionOrderIndex;
    }

    public static CloseableHttpClient getDisabledHttpsClient() {

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
            SSLConnectionSocketFactory ssl = new SSLConnectionSocketFactory(sslContext);
            PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(ssl).build();

            return HttpClients.custom().setConnectionManager(connectionManager).build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static RestTemplate createRestTemplate(Connector connector) {
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
        HttpComponentsClientHttpRequestFactory requestFactory;
        if (!connector.isSslCert()){
            requestFactory =  new HttpComponentsClientHttpRequestFactory(getDisabledHttpsClient());
        } else {
            requestFactory = new HttpComponentsClientHttpRequestFactory();
        }

        int timeout = connector.getTimeout();
        if (timeout > 0) {
            requestFactory.setConnectTimeout(timeout);
            restTemplateBuilder.setReadTimeout(Duration.ofMillis(timeout));
        }
        RestTemplate restTemplate = restTemplateBuilder.build();
        restTemplate.setRequestFactory(requestFactory);
        return restTemplate;
    }
 }
