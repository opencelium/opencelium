package com.becon.opencelium.backend.execution.test;

import com.becon.opencelium.backend.constant.InvokerRegEx;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.service.FieldNodeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TMethodExecutor implements TExecutor {

    private TExecutionMediator executionMediator;
    private TOperatorExecutor operatorExecutor;
    private MethodNode methodNode;
    private Invoker invoker;
    private RestTemplate restTemplate;

    public TMethodExecutor(TExecutionMediator executionMediator) {
        this.executionMediator = executionMediator;
        this.methodNode = executionMediator.getCurrentMethod();
        this.invoker = executionMediator.getInvoker();
        this.restTemplate = executionMediator.getRestTemplate();
    }

    @Override
    public void execute(MethodNode methodNode) {
        if (methodNode == null) {
            return;
        }
        TOperatorExecutor operatorExecutor = executionMediator.getOperatorExecutor();
        this.methodNode = methodNode;
        executionMediator.setCurrentMethod(methodNode);
        RequestNode requestNode = methodNode.getRequestNode();
        BodyNode bodyNode = methodNode.getRequestNode().getBodyNode();

        HttpMethod httpMethod = createMethod(requestNode.getMethod());
        HttpHeaders httpHeaders = createHttpHeaders();
        String endpoint = createEndpoint(requestNode.getEndpoint());
        String body = createBody(bodyNode);

        Object data;
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        String contentType = httpHeaders.get("Content-Type") != null ? httpHeaders.get("Content-Type").get(0) : null;
        if (contentType != null && httpHeaders.containsKey("Content-Type")
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

        if (invoker.getName().equals("CheckMK")){
            data = "request=" + body;
        }

        // TODO: Changed string to object in httpEntity;
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, httpHeaders);
        if (body.equals("null")){
            httpEntity = new HttpEntity <Object> (httpHeaders);
        }

        ResponseEntity<String> response = restTemplate.exchange(endpoint, httpMethod ,httpEntity, String.class);

        this.execute(methodNode.getNextFunction());
        operatorExecutor.execute(methodNode.getNextOperator());
    }



    private String createEndpoint(String endpoint) {

        String requiredField;
        String refRegex = "\\{(.*?)\\}";
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(endpoint);
        if(matcher.find()) {
            endpoint = replaceRefValue(endpoint);
        }
        return endpoint;
    }

    private HttpHeaders createHttpHeaders() {
        return null;
    }

    private HttpMethod createMethod(String method) {
        switch (method){
            case "POST":
                return HttpMethod.POST;
            case "DELETE":
                return HttpMethod.DELETE;
            case "PUT":
                return HttpMethod.PUT;
            case "GET":
                return HttpMethod.GET;
            default:
                throw new RuntimeException("Http method not found");
        }
    }

    private String createBody(BodyNode bodyNode) {
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

// --------------------------------------- PRIVATE ZONE ------------------------------ //

    private String replaceRefValue(String exp) {
        String result = exp;
        String refRegex = InvokerRegEx.requiredData;
        String refResRegex = InvokerRegEx.responsePointer;
        Pattern pattern = Pattern.compile(refRegex);
        Matcher matcher = pattern.matcher(exp);
        List<String> refParts = new ArrayList<>();
        while (matcher.find()){
            refParts.add(matcher.group());
        }

        for (String pointer : refParts) {
            if (pointer.matches(refResRegex)) {
                String ref = pointer.replace("{%", "").replace("%}", "");
                String value = (String) executionMediator.getValueFromResponseData(ref);
                result = result.replace(pointer, value);
            } else {
                // replace from request data
                String v = executionMediator.getValueFromRequestData(pointer);
                result = result.replace(pointer, v);
            }
        }

        return result;
    }

    private Map<String, Object> replaceValues(List<FieldNode> fieldNodes) {
        Map<String, Object> item = new HashMap<>();
        fieldNodes.forEach(f -> {
            boolean isObject = f.getType().equals("object");
            boolean isArray = f.getType().equals("array");

            if ((f.getValue() == null || f.getValue().equals("")) && (!isObject && !isArray)){
                return;
            }

            // replace from request_data
            if ((f.getValue() != null) && f.getValue().contains("{") && f.getValue().contains("}") && !isObject){

                item.put (f.getName(), executionMediator.getValueFromRequestData(f.getValue()));
                return;
            }

            // from enhancement
            if (hasEnhancement(f.getId())){
                MethodNode method = methodNode;
                item.put(f.getName(), executionMediator.getValueFromEnhancementData(f));
                return;
            }

            // from response data;
            if ((f.getValue()!=null) && !hasEnhancement(f.getId()) && FieldNodeService.hasReference(f.getValue())){
                item.put(f.getName(), executionMediator.getValueFromResponseData(f.getValue()));
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

    private boolean hasEnhancement(Long id) {
        List<EnhancementNode> enhancementNodes = executionMediator.getEnhancementNodes();

        for (EnhancementNode e : enhancementNodes) {
            for (FieldNode f : e.getIncomeField()) {
                if (f.getId().equals(id)) {
                    return true;
                }
            }

            for (FieldNode f : e.getOutgoingField()) {
                if (f.getId().equals(id)) {
                    return true;
                }
            }
        }

        return false;
    }


}
