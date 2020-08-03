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

package com.becon.opencelium.backend.neo4j.service;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.neo4j.entity.*;
import com.becon.opencelium.backend.neo4j.repository.FieldNodeRepository;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldResource;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.becon.opencelium.backend.utility.StringUtility;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FieldNodeServiceImp implements FieldNodeService {

    @Autowired
    private FieldNodeRepository fieldNodeRepository;

    @Autowired
    private MethodNodeServiceImp functionNodeService;

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private ValidationContext validationContext;

    @Override
    public FieldNode findFieldByResource(LinkedFieldResource fieldResource, Connection connection) {
        Long connectionId = connection.getId();

        MethodNode methodNode = methodNodeServiceImp.findByConnectionIdAndColor(connectionId, fieldResource.getColor())
                .orElseThrow(() -> new RuntimeException("METHOD_NOT_FOUND_FOR_FIELD"));
        ErrorMessageData messageData = validationContext.get(connection.getName());
        if (messageData == null){
            messageData = new ErrorMessageData();
            validationContext.put(connection.getName(), messageData);
        }
        messageData.setConnectorId(connection.getFromConnector());
        messageData.setIndex(methodNode.getIndex());
        messageData.setLocation("body");

        FieldNode currentField;
        String color = fieldResource.getColor();
        String type = fieldResource.getType();
        String field = fieldResource.getField();
        LinkedList<String> path = new LinkedList<>(Arrays.asList(field.split("\\.")));
        String result;
        if (type.equals("response")){
            result = path.pop();
            String firstField = path.pop();
            firstField = StringUtility.removeSquareBraces(firstField);
            currentField = fieldNodeRepository.findFirstFieldInResponse(connectionId,color,result,firstField);
        } else {
            String firstField;
            if (path.isEmpty()){
                firstField = field;
            } else {
                firstField = path.pop();
            }
            firstField = StringUtility.removeSquareBraces(firstField);
            currentField = fieldNodeRepository.findFirstFieldInRequest(connectionId,color,firstField);
        }

        if (currentField == null){
            throw new RuntimeException("Field path is incorrect in method with color: " + color);
        }

        for (String nextField : path) {
            nextField = StringUtility.removeSquareBraces(nextField);
            currentField = fieldNodeRepository.findNextField(nextField, currentField.getId());
        }

        return currentField;
    }

    @Override
    public LinkedFieldResource toLinkedFieldResource(FieldNode node) {
        LinkedFieldResource fieldResource = new LinkedFieldResource();
        MethodNode methodNode  = functionNodeService.getByFieldNodeId(node.getId())
                .orElseThrow(() -> new RuntimeException("Field with id=" + node.getId() + " not found"));

        String color = methodNode.getColor();
        String exchangeType = fieldHasRequest(node.getId()) ? "request" : "response";
        String field = getPath(methodNode, node).replace(color + ".", "")
                .replace("(" + exchangeType + ").", "");

        fieldResource.setColor(color);
        fieldResource.setType(exchangeType);
        fieldResource.setField(field);

        return fieldResource;
    }

    public static Map<String, Object> toResource(List<FieldNode> fieldNodes){
        Map<String, Object> fields = new HashMap<>();
        fieldNodes.forEach(f -> {
            if (f.getType().equals("object")) {

                if (f.getChild() == null || f.getChild().isEmpty()) {
                    if ((f.getValue() == null) || (f.getValue().length() == 0)){
                        fields.put(f.getName(), null);
                    } else {
                        fields.put(f.getName(), f.getValue());
                    }

                } else {
                    fields.put(f.getName(), toResource(f.getChild()));
                }
            } else if (f.getType().equals("array")){
                if (f.getChild() == null || f.getChild().isEmpty()){
                    if (f.getValue().isEmpty()){
                        fields.put(f.getName(), new ArrayList<>());
                        return;
                    }
                    String arrayRegex = "\\[(.*?)\\]"; // array [1, 2, 3]
                    final Pattern pattern = Pattern.compile(arrayRegex, Pattern.MULTILINE);
                    final Matcher matcher = pattern.matcher(f.getValue());
                    // If it is not an array
                    if (!matcher.matches()){
                        fields.put(f.getName(), f.getValue());
                        return;
                    }
                    String value = f.getValue().replace("[", "").replace("]", "");
                    String[] elements = value.split(",");
                    ArrayList<String> arrayList = new ArrayList<>(Arrays.asList(elements));
                    fields.put(f.getName(), arrayList);
                    return;
                }
                if (f.getValue() != null){
                    try {
                        List<Object> array = new ObjectMapper().readValue(f.getValue(), List.class);
                        fields.put(f.getName(), array);
                    } catch (Exception e){
                        throw new RuntimeException(e);
                    }
                } else {
                    Map<String, Object> arrayObj = toResource(f.getChild());
                    List<Object> array = new ArrayList<>();
                    array.add(arrayObj);
                    fields.put(f.getName(), array);
                }
            } else {
                fields.put(f.getName(), f.getValue());
            }
//            fields.put(f.getName(), f.getValue());
        });
        return fields;
    }

    @Override
    public String getPath(MethodNode methodNode, FieldNode fieldNode) {
        String color = methodNode.getColor();
        String type = fieldHasRequest(fieldNode.getId()) ? "request" : "response";
        String result = "";
        if (type.equals("response")){
            result = fieldHasSuccess(fieldNode.getId()) ? "success" : "fail";
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

    @Override
    public boolean fieldHasRequest(Long fieldId) {
        RequestNode requestNode = fieldNodeRepository.fieldHasRequest(fieldId);
        return requestNode != null;
    }

    @Override
    public boolean fieldHasSuccess(Long fieldId) {
        ResultNode resultNode = fieldNodeRepository.fieldHasSuccess(fieldId);
        return  resultNode.getName().equals("success");
    }

    @Override
    public boolean hasEnhancement(Long fieldId) {
        EnhancementNode enhancementNode = fieldNodeRepository.hasEnhancement(fieldId).orElse(null);
        return enhancementNode != null;
    }

    @Override
    public List<FieldNode> findIncoming(Long outgoingId) {
        return fieldNodeRepository.findIncoming(outgoingId);
    }

    @Override
    public String getFieldValue(FieldNode fieldNode) {
        try{
            ObjectMapper mapperObj = new ObjectMapper();
            String value = fieldNode.getValue();
            String invokerName = fieldNodeRepository.findInvoker(fieldNode.getId());
            MethodNode methodNode = functionNodeService.getByFieldNodeId(fieldNode.getId())
                    .orElseThrow(() -> new  RuntimeException("Method doesn't contain field with id=" + fieldNode.getId()));
            String path = getPath(methodNode, fieldNode);

            if (fieldNode.getType().equals("object")){
                if (fieldNode.getChild() != null){
                    value = mapperObj.writeValueAsString(toResource(fieldNode.getChild()));
                } else {
                    value = invokerService.findFieldByPath(invokerName, methodNode.getName(), path);
                }

            } else if(fieldNode.getType().equals("array")) {
                if (fieldNode.getChild() != null){
                    value = mapperObj.writeValueAsString(Arrays.asList(toResource(fieldNode.getChild())));
                } else {
                    value = invokerService.findFieldByPath(invokerName, methodNode.getName(), path);
                }
            }
            return value;
        } catch (JsonProcessingException e){
            throw  new RuntimeException(e);
        }
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

    public static boolean hasReference(String fieldValue) {
        String regex = "#(([a-zA-Z0-9]+).\\(response\\)|([a-zA-Z0-9]+).\\(request\\))";
        Pattern pattern = Pattern.compile(regex);

        Matcher matcher = pattern.matcher(fieldValue);
        while (matcher.find()){
            return true;
        }
        return false;
    }

    @Override
    public boolean existsInInvokerMethod(String invokerName, String methodName, String path) {
        String pathValue = ConditionUtility.getRefValue(path);
        String exchangeType = ConditionUtility.getExchangeType(path);
        String result = ConditionUtility.getResult(path);
        Invoker invoker = invokerService.findByName(invokerName);
        FunctionInvoker functionInvoker = invoker.getOperations().stream().filter(o -> o.getName().equals(methodName))
                .findFirst().orElseThrow(() -> new RuntimeException("Method not found in invoker"));

        Map<String, Object> fields;
        if (exchangeType.equals("response") && result.equals("success")){
            fields = functionInvoker.getResponse().getSuccess().getBody().getFields();
        } else if (exchangeType.equals("response") && result.equals("fail")){
            fields = functionInvoker.getResponse().getFail().getBody().getFields();
        } else {
            fields = functionInvoker.getRequest().getBody().getFields();
        }

        Object value = new Object();
        String[] valueParts;
        if (pathValue.contains(".")){
            valueParts = pathValue.split("\\.");
        } else {
            valueParts = new String[1];
            valueParts[0] = pathValue;
        }

        boolean exists = false;
        for (String part : valueParts) {
            exists = fields.containsKey(part);
            if (!exists){
                continue;
            }

            value = fields.get(part);
            if (value instanceof Map){
                fields = ( Map<String, Object>) value;
            }
            if (value instanceof ArrayList){
                fields = (( ArrayList<Map<String, Object>>) value).get(0);
            }

        }
        return exists;
    }

    @Override
    public Map<String, Object> deleteEmptyFields(Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();

        body.forEach((k,v) -> {
            if (v instanceof HashMap){
                result.put(k,deleteEmptyFields((Map<String, Object>) v));
            }

            if (v instanceof ArrayList){
                ArrayList<Object> list = (ArrayList<Object>) v;
                ArrayList<Object> nonEmptyList = new ArrayList<>();

                list.forEach(m -> {
                    if (m instanceof HashMap){
                        nonEmptyList.add(deleteEmptyFields((Map<String, Object>) m));
                        return;
                    }
                    nonEmptyList.add(m);
                });

                result.put(k,nonEmptyList);
            }

            if (!v.equals("") && !(v instanceof HashMap || v instanceof ArrayList)){
                result.put(k,v);
            }
        });

        return result;
    }

    @Override
    public boolean valueIsJSON(String json) {
        boolean isJson = false;
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(DeserializationFeature.FAIL_ON_READING_DUP_TREE_KEY);
            JsonFactory factory = mapper.getFactory();
            JsonParser parser = factory.createParser(json);
            JsonNode jsonObj = mapper.readTree(parser);
            if (jsonObj instanceof ObjectNode){
                isJson = true;
            } else if (jsonObj instanceof  ArrayNode){
                isJson = true;
            }
        } catch (IOException e) {
            isJson = false;
        }

        return isJson;
    }
}
