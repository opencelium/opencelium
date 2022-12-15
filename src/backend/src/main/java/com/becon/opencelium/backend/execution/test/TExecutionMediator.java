package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.execution.ExecutionMediator;
import com.becon.opencelium.backend.execution.MessageContainer;
import com.becon.opencelium.backend.execution.test.entity.TConnection;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.springframework.web.client.RestTemplate;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TExecutionMediator implements ExecutionMediator {

    private final ConnectionNode connectionNode;
    private final List<EnhancementNode> enhancementNodes;
    private final List<Enhancement> enhancements;
    private final Map<String, List<RequestData>> requestDataMap; // contains both connector's request data
    private final InvokerService invokerService;
    private final RestTemplate restTemplate;
    private Map<String, List<MethodNode>> methods;

    private TConnection testConnection;
    private ConnectorNode connectorNode;
    private Invoker invoker;
    private StatementNode currentOperator;
    private MethodNode currentMethod;

    private List<RequestData> supportRequestData = new LinkedList<>();
    private ArrayList<MessageContainer> responseData = new ArrayList<>();
    private Map<String, Integer> loopIndex = new HashMap<>();
    private String conn;

    private TOperatorExecutor operatorExecutor;
    private TMethodExecutor methodExecutor;


    private TExecutionMediator(ConnectionNode connectionNode, List<EnhancementNode> enhancementNodes,
                               List<Enhancement> enhancements, Map<String, List<RequestData>> requestDataMap,
                               InvokerService invokerService, RestTemplate restTemplate) {
        this.connectionNode = connectionNode;
        this.enhancementNodes = enhancementNodes;
        this.enhancements = enhancements;
        this.requestDataMap = requestDataMap;
        this.invokerService = invokerService;
        this.restTemplate = restTemplate;
    }

    public TConnection getTestConnection() {
        return testConnection;
    }

    public void setTestConnection(TConnection testConnection) {
        this.testConnection = testConnection;
    }

    public ConnectorNode getConnectorNode() {
        return connectorNode;
    }

    public void setConnectorNode(ConnectorNode connectorNode) {
        this.connectorNode = connectorNode;
    }

    public StatementNode getCurrentOperator() {
        return currentOperator;
    }

    public void setCurrentOperator(StatementNode currentOperator) {
        this.currentOperator = currentOperator;
    }

    public MethodNode getCurrentMethod() {
        return currentMethod;
    }

    public void setCurrentMethod(MethodNode currentMethod) {
        this.currentMethod = currentMethod;
    }

    public List<RequestData> getSupportRequestData() {
        return supportRequestData;
    }

    public void setSupportRequestData(List<RequestData> supportRequestData) {
        this.supportRequestData = supportRequestData;
    }

    public ArrayList<MessageContainer> getResponseData() {
        return responseData;
    }

    public void setResponseData(ArrayList<MessageContainer> responseData) {
        this.responseData = responseData;
    }

    public Map<String, Integer> getLoopIndex() {
        return loopIndex;
    }

    public void setLoopIndex(Map<String, Integer> loopIndex) {
        this.loopIndex = loopIndex;
    }

    public String getConn() {
        return conn;
    }

    public void setConn(String conn) {
        this.conn = conn;
    }

    public Map<String, List<RequestData>> getRequestDataMap() {
        return requestDataMap;
    }

    public Map<String, List<MethodNode>> getMethods() {
        return methods;
    }

    public void setMethods(Map<String, List<MethodNode>> methods) {
        this.methods = methods;
    }

    public TOperatorExecutor getOperatorExecutor() {
        return operatorExecutor;
    }

    public void setOperatorExecutor(TOperatorExecutor operatorExecutor) {
        this.operatorExecutor = operatorExecutor;
    }

    public InvokerService getInvokerService() {
        return invokerService;
    }

    public TMethodExecutor getMethodExecutor() {
        return methodExecutor;
    }

    public void setMethodExecutor(TMethodExecutor methodExecutor) {
        this.methodExecutor = methodExecutor;
    }

    public Invoker getInvoker() {
        return invoker;
    }

    public void setInvoker(Invoker invoker) {
        this.invoker = invoker;
    }

    public RestTemplate getRestTemplate() {
        return restTemplate;
    }

    @Override
    public ConnectionNode getConnectionNode() {
        return connectionNode;
    }

    @Override
    public List<EnhancementNode> getEnhancementNodes() {
        return enhancementNodes;
    }

    @Override
    public List<Enhancement> getEnhancements() {
        return enhancements;
    }

    @Override
    public Map<String, List<RequestData>> requestDataMap() {
        return requestDataMap;
    }

// -------------------------------- Implementation --------------------------------------------- //

    public Object getValueFromResponseData(String ref) {
        String color = ConditionUtility.getMethodKey(ref);

        MessageContainer messageContainer = responseData
                .stream()
                .filter(m -> m.getMethodKey().equals(color))
                .findFirst().orElse(null);
        return messageContainer.getValue(ref, getLoopIndex());
    }

    public String getValueFromRequestData(String exp) {
        if (exp == null || exp.isEmpty()) {
            return "";
        }
        List<RequestData> requestData = requestDataMap.get(connectorNode.getName());
        List<RequestData> request = new ArrayList<>();
//        String conn = exp.substring(1, 6);
        if ((exp.contains("CONN1.") && !conn.equals("CONN1")) || (exp.contains("CONN2.") && !conn.equals("CONN1"))){
            request = supportRequestData;
        } else {
            request = requestData;
        }

        String result = exp;
        for (RequestData data : request) {
            String pointer = "{" + data.getField() + "}";
            if (exp.contains("CONN1.")){
                pointer = "{" + "CONN1." + data.getField() + "}";
            } else if (exp.contains("CONN2.")) {
                pointer = "{" + "CONN2." + data.getField() + "}";
            }
            if (!result.contains(pointer)){
                continue;
            }
            result = result.replace(pointer, data.getValue());
        }
        return result;
    }

    public Object getValueFromEnhancementData(FieldNode outgoingField) {
        Enhancement enhancement = findEnhByFieldId(outgoingField.getId());
        EnhancementNode enhancementNode = findEnhNodeByFieldId(outgoingField.getId());
        List<FieldNode> incomingFields = enhancementNode.getIncomeField();

        // var_result : #456osdk.(response).success.result[];
        Map<String, String> expertVars = parseExpertVars(enhancement.getExpertVar());

        boolean isObject = outgoingField.getType().equals("object");
        // TODO: for array case need to make it
//            boolean isArray = fieldNode.getFieldType().equals(ActionConfig.Field.ARRAY);
        boolean isArray = outgoingField.getType().equals("array");

        Map<String, String> expertVarProperties = new HashMap<>();
        ObjectMapper mapperObj = new ObjectMapper();

//        MethodNode outMethod = methodNodeService.getByFieldNodeId(outgoingField.getId())
//                .orElseThrow(() -> new RuntimeException("Method not found"));

        MethodNode outMethod = currentMethod;
        String outFieldPath = getPath(outMethod, outgoingField);
        String outFieldValue = getFieldValue(outgoingField);
        expertVarProperties.put(outFieldPath, outFieldValue);

        incomingFields.forEach(f -> {
            try {
                MethodNode inMethod = getMethodByFieldId(f.getId());
                if (inMethod == null) {
                    throw new RuntimeException("Method not found");
                }
                String inFieldPath = getPath(inMethod, f);
                MessageContainer messageContainer = responseData
                        .stream()
                        .filter(m -> m.getMethodKey().equals(inMethod.getColor()))
                        .findFirst().orElse(null);
                Object o = messageContainer.getValue(inFieldPath, getLoopIndex());
                String inFieldValue = o instanceof String ? o.toString() : mapperObj.writeValueAsString(o);
                expertVarProperties.put(inFieldPath, inFieldValue);
            } catch (JsonProcessingException e){
                throw new RuntimeException(e);
            }
        });

        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
        expertVarProperties.forEach((k,v) -> {
            try {
                String var = expertVars.get(k);

                if (valueIsJSON(v)){
                    engine.put("dataModel", v);
                    JSObject obj = (JSObject)engine.eval("JSON.parse(dataModel)");
                    engine.put(var, obj);
                } else {
                    engine.put(var, v);
                }
            } catch (ScriptException e){
                throw new RuntimeException(e);
            }
        });

        try {
            engine.eval(enhancement.getExpertCode());

            String v = expertVars.get(outFieldPath);
            Object o = engine.get(v);
            ScriptObjectMirror JSON = (ScriptObjectMirror) engine.eval("JSON");
            Object stringified = JSON.callMember("stringify", o);
            String result = stringified.toString();

            if (isObject){
                return mapperObj.readValue(result, new TypeReference<Map<String, Object>>(){});
            } else if(isArray) {
                String arrayRegex = "\\[(.*?)\\]";
                final Pattern pattern = Pattern.compile(arrayRegex, Pattern.MULTILINE);
                final Matcher matcher = pattern.matcher(result);
                if (!matcher.matches()){
                    throw new RuntimeException("Expected an array while running enhancement.");
                }
                return convertToArray(result);
            } else {
                result = result.replace("\"", "");
                return result;
            }
        } catch (ScriptException | IOException e){
            throw new RuntimeException(e);
        }
    }

    private String getFieldValue(FieldNode fieldNode) {
        try{
            ObjectMapper mapperObj = new ObjectMapper();
            String value = fieldNode.getValue();
            String invokerName = connectorNode.getName();
            MethodNode methodNode = getMethodByFieldId(fieldNode.getId());
            String path = getPath(methodNode, fieldNode);

            if (fieldNode.getType().equals("object")){
                if (fieldNode.getChild() != null){
                    value = mapperObj.writeValueAsString(FieldNodeServiceImp.toResource(fieldNode.getChild()));
                } else {
                    value = invokerService.findFieldByPath(invokerName, methodNode.getName(), path);
                }

            } else if(fieldNode.getType().equals("array")) {
                if (fieldNode.getChild() != null){
                    value = mapperObj.writeValueAsString(Arrays.asList(FieldNodeServiceImp.toResource(fieldNode.getChild())));
                } else {
                    value = invokerService.findFieldByPath(invokerName, methodNode.getName(), path);
                }
            }
            return value;
        } catch (JsonProcessingException e){
            throw  new RuntimeException(e);
        }
    }

    private MethodNode getMethodByFieldId(Long fieldId) {
        List<MethodNode> fromMethods = methods.get(Constant.CONN_FROM);
        List<MethodNode> toMethods = methods.get(Constant.CONN_TO);

        for (MethodNode m : fromMethods) {
            List<FieldNode> fieldNodes = m.getResponseNode().getSuccess().getBody().getFields();
            if(fieldExists(fieldNodes, fieldId)) {
                return  m;
            }
        }

        for (MethodNode m : toMethods) {
            List<FieldNode> fieldNodes = m.getResponseNode().getSuccess().getBody().getFields();
            if(fieldExists(fieldNodes, fieldId)) {
                return  m;
            }
        }

        return null;
    }

    private Enhancement findEnhByFieldId(Long id) {
        EnhancementNode enhancementNode = findEnhNodeByFieldId(id);
        return enhancements.stream().filter(e -> e.getId().equals(enhancementNode.getEnhanceId())).findFirst().get();
    }

    private EnhancementNode findEnhNodeByFieldId(Long id) {
       List<EnhancementNode> enhancementNodes = getEnhancementNodes();

       for (EnhancementNode enhancementNode : enhancementNodes) {
           for (FieldNode f : enhancementNode.getOutgoingField()) {
               if (f.getId().equals(id)){
                   return enhancementNode;
               }
           }

           for (FieldNode f : enhancementNode.getIncomeField()) {
               if (f.getId().equals(id)){
                   return enhancementNode;
               }
           }
       }
       return null;
    }

    private List<?> convertToArray(String stringifiedArray){
        try {
//            List<String> array = new ArrayList<>();
            ObjectMapper mapper = new ObjectMapper();
            return (List) mapper.readValue(stringifiedArray, Object.class);
        } catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    private Map<String, String> parseExpertVars(String vars){
        Map<String,String> result = new HashMap<>();
        String[] line = vars.split("//");

        String key, value;
        for (String s : line){
            if (s.equals("") || !s.contains("var")){
                continue;
            }
//            int equal = s.indexOf("=");
            value = s.substring(s.indexOf('v')+3, s.indexOf('=')).replaceAll("\\s","");
            key = s.substring(s.indexOf('=') + 1)
                    .replaceAll("\\s", "")
                    .replaceAll("\\n","")
                    .replace(";","");

            result.put(key, value);
        }

        return result;
    }

    private String getPath(MethodNode methodNode, FieldNode fieldNode) {
        String color = methodNode.getColor();
        String type = fieldInRequest(fieldNode.getId()) ? "request" : "response";
        String result = "";
        if (type.equals("response")){
            result = fieldInSuccess(fieldNode.getId()) ? "success" : "fail";
        }

        List<FieldNode> fieldNodes = new ArrayList<>();

        if (type.equals("request")){
            fieldNodes = methodNode.getRequestNode().getBodyNode().getFields();
        } else if(type.equals("response") && result.equals("success")){
            fieldNodes = methodNode.getResponseNode().getSuccess().getBody().getFields();
            result  = result + ".";
        } else if(type.equals("response") && result.equals("fail")){
            fieldNodes = methodNode.getResponseNode().getFail().getBody().getFields();
            result  = result + ".";
        }

        result = result + fieldAsString(fieldNodes, fieldNode);

        return color + ".(" + type + ")." + result;
    }

    private boolean fieldExists(List<FieldNode> fields, Long id) {
        if (fields == null) {
            return false;
        }

        for (FieldNode field : fields) {
            if (field.getId().equals(id)){
                return true;
            }
            if (field.getChild() != null && fieldExists(field.getChild(), id)) {
                return true;
            }
        }
        return false;
    }

    private boolean fieldInSuccess(Long id) {
        List<FieldNode> fieldNodes = this.currentMethod.getResponseNode().getSuccess().getBody().getFields();
        return fieldExists(fieldNodes, id);
    }

    private boolean fieldInFail(Long id) {
        List<FieldNode> fieldNodes = this.currentMethod.getResponseNode().getFail().getBody().getFields();
        return fieldExists(fieldNodes, id);
    }

    private boolean fieldInRequest(Long id) {
        List<FieldNode> fieldNodes = this.currentMethod.getRequestNode().getBodyNode().getFields();
        return fieldExists(fieldNodes, id);
    }

    private String fieldAsString(List<FieldNode> fieldNodes, FieldNode fieldNode){
        String result = "";

        for (FieldNode f : fieldNodes) {
            if (f == null){
                continue;
            }

            if (f.getChild() != null){
                if (f.getId().equals(fieldNode.getId())){
                    if (f.getType().equals("array")){
                        result = result + f.getName() + "[]";
                    } else {
                        result = result + f.getName();
                    }
                    continue;
                }
                String child = fieldAsString(f.getChild(), fieldNode);
                if (f.getType().equals("array")){
                    result = result + f.getName() + "[]";
                }else {
                    result = result + f.getName();
                }
                result = result + "." + child;
                if (child.equals("")){
                    result = "";
                    continue;
                }
            }
            if (f.getId().equals(fieldNode.getId())){
                if (f.getType().equals("array")){
                    result = result + f.getName() + "[]";
                } else {
                    result = result + f.getName();
                }
                break;
            }
        }
        return result;
    }

    private boolean valueIsJSON(String json) {
        boolean isJson = false;
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(DeserializationFeature.FAIL_ON_READING_DUP_TREE_KEY);
            JsonFactory factory = mapper.getFactory();
            JsonParser parser = factory.createParser(json);
            JsonNode jsonObj = mapper.readTree(parser);
            if (jsonObj instanceof ObjectNode){
                isJson = true;
            } else if (jsonObj instanceof ArrayNode){
                isJson = true;
            }
        } catch (IOException e) {
            isJson = false;
        }

        return isJson;
    }

    // ----------------------------------- Builder ---------------------------------------------------- //
    public static class Builder {
        private ConnectionNode connectionNode;
        private List<EnhancementNode> enhancementNodes;
        private List<Enhancement> enhancements;
        private Map<String, List<RequestData>> requestDataMap;
        private InvokerService invokerService;
        private RestTemplate restTemplate;

        public Builder setConnectionNode(ConnectionNode connectionNode) {
            this.connectionNode = connectionNode;
            return this;
        }

        public Builder setEnhancementNodes(List<EnhancementNode> enhancementNodes) {
            this.enhancementNodes = enhancementNodes;
            return this;
        }

        public Builder setEnhancements(List<Enhancement> enhancements) {
            this.enhancements = enhancements;
            return this;
        }

        public Builder setRequestDataMap(Map<String, List<RequestData>> requestDataMap) {
            this.requestDataMap = requestDataMap;
            return this;
        }

        public Builder setInvokerService(InvokerService invokerService) {
            this.invokerService = invokerService;
            return this;
        }

        public Builder setRestTemplate(RestTemplate restTemplate) {
            this.restTemplate = restTemplate;
            return this;
        }

        public TExecutionMediator build() {
            return new TExecutionMediator(connectionNode, enhancementNodes, enhancements, requestDataMap,
                                          invokerService, restTemplate);
        }
    }
}
