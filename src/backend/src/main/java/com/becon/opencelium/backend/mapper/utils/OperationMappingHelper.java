package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.database.mongodb.service.MethodMngService;
import com.becon.opencelium.backend.database.mongodb.service.MethodMngServiceImp;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.*;
import com.becon.opencelium.backend.utility.ConditionUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class OperationMappingHelper {
    @Autowired
    @Qualifier("invokerServiceImp")
    private InvokerService invokerService;
    @Autowired
    @Qualifier("methodMngServiceImp")
    private MethodMngService methodMngService;
    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String REGEX_REF_PARAMETER = "\\{#.+}";
    private static final String REGEX_DEEP_OBJECT_IN_QUERY = ".+[\\[.+\\]]";
    private static final String REGEX_ARRAY_PARAMETER_IN_PATH = ".+[&|,\\s]+.*";

    public List<OperationDTO> toOperationAll(List<MethodMng> methods, String invoker) {
        List<OperationDTO> operations = new ArrayList<>();
        for (MethodMng method : methods) {
            operations.add(toOperation(method, invoker));
        }
        return operations;
    }

    public OperationDTO toOperation(@NonNull MethodMng method, String invoker) {
        Map<String, String> header = method.getRequest().getHeader();
        MediaType mediaType = null;
        if (header != null) {
            if (header.containsKey(HEADER_CONTENT_TYPE)) {
                mediaType = MediaType.valueOf(header.get(HEADER_CONTENT_TYPE));
            }
        } else {
            method.getRequest().setHeader(new HashMap<>());
        }

        OperationDTO operationDTO = new OperationDTO();
        operationDTO.setOperationId(method.getColor());
        operationDTO.setHttpMethod(HttpMethod.valueOf(method.getRequest().getMethod()));
        operationDTO.setName(method.getName());
        operationDTO.setPath(method.getRequest().getEndpoint());
        operationDTO.setExecOrder(method.getIndex());
        operationDTO.setRequestBody(getRequestBody(method.getRequest().getBody(), mediaType, invoker));
        operationDTO.setParameters(getParameters(method.getRequest(), mediaType));
        return operationDTO;
    }

    /**
     * returns all parameters from HEADER, QUERY and PATH.
     * Not including COOKIE parameters
     *
     * @return not null, at least empty list of parameters
     */
    private List<ParameterDTO> getParameters(@NonNull RequestMng request, MediaType mediaType) {
        //get all parameters from header. if there is no header parameter it will be empty, not null
        List<ParameterDTO> parameters = getHeaderParameters(request.getHeader(), mediaType);

        //add all query parameters
        int indexOfQuestionSign = request.getEndpoint().indexOf("?");
        if (indexOfQuestionSign != -1) {
            String query = request.getEndpoint().substring(indexOfQuestionSign + 1); //get all queries
            parameters.addAll(getQueryParameters(query, mediaType));
        }

        //add all path parameters
        if (indexOfQuestionSign != -1) {
            String path = request.getEndpoint().substring(0, indexOfQuestionSign);
            parameters.addAll(getPathParameters(path, mediaType));
        }
        parameters.addAll(getPathParameters(request.getEndpoint(), mediaType));

        return parameters;
    }

    /**
     * returning parameter's fields :
     * - in always will be HEADER
     * - style always will be SIMPLE
     * - schemaDTO.type will be STRING, ARRAY or OBJECT
     * - explode will be true if schemaDTO.type is OBJECT, otherwise false
     * see also doc about parameter styles <a href="https://swagger.io/docs/specification/serialization/">link</a>
     *
     * @return all header parameters, maybe empty but not null
     */
    private List<ParameterDTO> getHeaderParameters(@NonNull Map<String, String> header, MediaType mediaType) {
        List<ParameterDTO> parameters = new ArrayList<>();

        for (Map.Entry<String, String> entry : header.entrySet()) {
            ParameterDTO parameterDTO = new ParameterDTO();
            //parameter's default fields are :
            parameterDTO.setName(entry.getKey());
            parameterDTO.setIn(ParamLocation.HEADER);
            parameterDTO.setStyle(ParamStyle.SIMPLE);
            parameterDTO.setContent(mediaType);
            boolean explode = false; //it may be changed only and only if the parameter is object

            String value = entry.getValue();
            if (value == null || value.isBlank()) {
                continue;
            }
            String[] split = value.split(",");

            //this if-else-if statements for just setting a schema to parameter
            if (split.length == 1) { //is it not array and not object?
                parameterDTO.setSchema(getSchema(value, DataType.STRING));
            } else if (split[0].contains("=")) { //is it object?
                explode = true;
                SchemaDTO schemaDTO = new SchemaDTO();
                schemaDTO.setType(DataType.OBJECT);
                Map<String, SchemaDTO> propertiesOfObject = new HashMap<>();
                for (String s : split) {
                    String[] pairs = s.split("=");
                    propertiesOfObject.put(pairs[0], getSchema(pairs[1], DataType.STRING));
                }
                schemaDTO.setProperties(propertiesOfObject);
                parameterDTO.setSchema(schemaDTO);
            } else {//then, it is array
                parameterDTO.setSchema(getSchema(value, DataType.ARRAY));
            }

            parameterDTO.setExplode(explode);
            parameters.add(parameterDTO);
        }
        return parameters;
    }

    /**
     * returning parameter's fields :
     * - in always will be PATH
     * - style always will be SIMPLE
     * - schemaDTO.type always will be STRING
     * - explode always will be false
     * see also doc about parameter styles <a href="https://swagger.io/docs/specification/serialization/">link</a>
     *
     * @return all path parameters, maybe empty but not null
     */
    private List<ParameterDTO> getPathParameters(String path, MediaType mediaType) {
        if (path == null || path.trim().isBlank()) {
            return Collections.emptyList();
        } else {
            List<ParameterDTO> list = new ArrayList<>();
            String[] split = path.split("/");
            for (String subPath : split) {
                if (subPath.matches(REGEX_REF_PARAMETER)) {
                    String subPathName = subPath.substring(1, subPath.length() - 1);
                    ParameterDTO parameterDTO = new ParameterDTO();
                    parameterDTO.setIn(ParamLocation.PATH);
                    parameterDTO.setName(subPathName);
                    parameterDTO.setStyle(ParamStyle.SIMPLE);
                    parameterDTO.setContent(mediaType);
                    parameterDTO.setSchema(getSchema(subPathName, DataType.STRING));
                    list.add(parameterDTO);
                }
            }
            return list;
        }
    }

    /**
     * returning parameter's fields :
     * - in always will be QUERY
     * - style could be FORM, SPACE_DELIMITED, PIPE_DELIMITED and DEEP_OBJECT
     * - schemaDTO.type could be STRING, ARRAY and OBJECT
     * - explode could be false and true depending on style
     * see also doc about parameter styles <a href="https://swagger.io/docs/specification/serialization/">link</a>
     *
     * @return all query parameters, maybe empty but not null
     */
    private List<ParameterDTO> getQueryParameters(String query, MediaType mediaType) {
        if (query == null || query.trim().isBlank()) return Collections.emptyList();

        List<ParameterDTO> parameters = new ArrayList<>(); //stores all parameters to return
        Map<String, String> parametersMap = new HashMap<>(); //stores string and array parameters only
        Tree objectParametersTree = new Tree(); //stores object parameters

        String[] pairsRaw = query.split("&"); //stores all parameters as <k,v> temporary
        //loop for storing all parameters to parametersMap
        for (String p : pairsRaw) {
            String[] split = p.split("=");
            parametersMap.merge(split[0], split[1], (oldV, newV) -> oldV + "&" + newV);
        }

        //main loop for making parameterDTO depending on param's style.
        //this loop doesn't create parameterDTO if it is object (ex. user[name]=A&user[id]=1)
        //it pass all objects to Tree's insert method. it deals with objects
        for (Map.Entry<String, String> entry : parametersMap.entrySet()) {
            ParameterDTO parameterDTO = new ParameterDTO();
            //if value is array and SPACE_DELIMITED, space comes encoded form, "%20
            String value = entry.getValue().replace("%20", " ");

            //is it object? Then pass it to the Tree and end the current iteration of a loop
            if (entry.getKey().matches(REGEX_DEEP_OBJECT_IN_QUERY)) {
                objectParametersTree.insert(entry.getKey(), value);
                continue;
            }
            //is it array? Then pass it with parameterDTO to the dealWithArray.
            //It deals with that array and sets necessary fields to the parameterDTO
            else if (value.matches(REGEX_ARRAY_PARAMETER_IN_PATH)) {
                dealWithArray(value, parameterDTO);
            } else {//then it is just string.
                parameterDTO.setStyle(ParamStyle.FORM);
                parameterDTO.setExplode(true);
                //if it is ref param, gets it's pure name
                if (value.matches(REGEX_REF_PARAMETER)) {
                    value = value.substring(1, value.length() - 1);
                }
                parameterDTO.setSchema(getSchema(value, DataType.STRING));
            }

            //parameter's default fields are:
            parameterDTO.setName(entry.getKey());
            parameterDTO.setContent(mediaType);
            parameterDTO.setIn(ParamLocation.QUERY);
            parameters.add(parameterDTO);
        }

        //adding DEEP_OBJECT parameters
        ParameterDTO parameterDTO = new ParameterDTO();
        parameterDTO.setContent(mediaType);
        parameterDTO.setIn(ParamLocation.QUERY);
        parameterDTO.setStyle(ParamStyle.DEEP_OBJECT);
        parameterDTO.setExplode(true);
        //loop for adding each object in Tree to parameters
        for (Node node : objectParametersTree.getNodes()) {
            parameterDTO.setName(node.getKey());
            parameterDTO.setSchema(getSchema(node));
            parameters.add(parameterDTO);
        }
        return parameters;
    }

    private RequestBodyDTO getRequestBody(@NonNull BodyMng body, MediaType mediaType, String invoker) {
        RequestBodyDTO requestBodyDTO = new RequestBodyDTO();
        requestBodyDTO.setContent(mediaType);
        requestBodyDTO.setSchema(getSchema(body, invoker));
        return requestBodyDTO;
    }

    private SchemaDTO getSchema(String source, DataType dataType) {
        return switch (dataType) {
            case NUMBER -> new SchemaDTO(DataType.NUMBER, source);
            case INTEGER -> new SchemaDTO(DataType.INTEGER, source);
            case STRING -> new SchemaDTO(DataType.STRING, source);
            case BOOLEAN -> new SchemaDTO(DataType.BOOLEAN, source);
            case ARRAY -> getSchemaFromArray(source);
            case OBJECT -> null;
        };
    }

    private SchemaDTO getSchema(BodyMng body, String invoker) {
        if (body == null || body.getFields() == null) return null;
        Map<String, Object> fields = body.getFields();
        SchemaDTO schemaDTO = new SchemaDTO();
        if (Objects.equals(body.getType(), "array")) {
            schemaDTO.setType(DataType.ARRAY);
            List<SchemaDTO> elements = new ArrayList<>();
            for (Object value : fields.values()) {
                elements.add(getSchemaFromObject(value, invoker));
            }
            schemaDTO.setItems(elements);
        } else {
            schemaDTO.setType(DataType.OBJECT);
            Map<String, SchemaDTO> props = new HashMap<>();
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                props.put(entry.getKey(), getSchemaFromObject(entry.getValue(), invoker));
            }
            schemaDTO.setProperties(props);
        }
        return schemaDTO;
    }

    private SchemaDTO getSchema(Node node) {
        SchemaDTO schemaDTO = new SchemaDTO();
        //if value is not null then it has not fields, in other words, it is a leaf
        if (node.getValue() != null) {
            String value = node.getValue();
            if (value.matches(REGEX_REF_PARAMETER)) {
                value = value.substring(1, value.length() - 1);
            }
            schemaDTO.setType(DataType.STRING);
            schemaDTO.setValue(value);
            return schemaDTO;
        }
        String firstKey = node.getFields().get(0).getKey();
        //is it array? If it is an array it's all field's key is a number
        //checking first field's key is enough
        if (firstKey.matches("[\\d+]")) {
            if (schemaDTO.getItems() == null) {
                schemaDTO.setItems(new ArrayList<>());
            }
            for (Node field : node.getFields()) {
                //recursively do the same work with it's all fields(items)
                schemaDTO.getItems().add(getSchema(field));
            }
            schemaDTO.setType(DataType.ARRAY);
        } else {// then it is an object.
            for (Node field : node.getFields()) {
                if (schemaDTO.getProperties() == null) {
                    schemaDTO.setProperties(new HashMap<>());
                }
                schemaDTO.setType(DataType.OBJECT);
                //recursively do the same work with it's all fields
                schemaDTO.getProperties().put(field.getKey(), getSchema(field));
            }
        }
        return schemaDTO;
    }

    private SchemaDTO getSchemaFromObject(Object obj, String invoker) {
        SchemaDTO schemaDTO = new SchemaDTO();
        DataType type = getType(obj);
        if (obj == null || type == null)
            return null;
        if (type == DataType.STRING) {
            String value = String.valueOf(obj);
            if (value.matches(RegExpression.directRef)) {
                String methodNameOfRef = methodMngService.getNameByCode(ConditionUtility.getMethodKey(value));
                schemaDTO.setType(invokerService.findFieldType(invoker, methodNameOfRef, value));
            } else {
                schemaDTO.setType(DataType.STRING);
            }
            schemaDTO.setValue(value);
        } else if (type != DataType.OBJECT & type != DataType.ARRAY) {
            schemaDTO.setType(type);
            schemaDTO.setValue(String.valueOf(obj));
        } else if (obj instanceof List<?> items) {
            schemaDTO.setType(DataType.ARRAY);
            List<SchemaDTO> elements = new ArrayList<>();
            for (Object item : items) {
                elements.add(getSchemaFromObject(item, invoker));
            }
            schemaDTO.setItems(elements);
        } else {
            @SuppressWarnings("unchecked") Map<String, ?> map = (Map<String, ?>) obj;
            schemaDTO.setType(DataType.OBJECT);
            Map<String, SchemaDTO> fields = new HashMap<>();
            for (Map.Entry<String, ?> entry : map.entrySet()) {
                fields.put(entry.getKey(), getSchemaFromObject(entry.getValue(), invoker));
            }
            schemaDTO.setProperties(fields);
        }
        return schemaDTO;
    }

    private SchemaDTO getSchemaFromArray(String source) {
        String[] split = source.split(",");
        SchemaDTO schemaDTO = new SchemaDTO();
        schemaDTO.setType(DataType.ARRAY);
        List<SchemaDTO> schemas = new ArrayList<>();
        for (String s : split) {
            if (s.matches(REGEX_REF_PARAMETER)) {
                s = s.substring(1, s.length() - 1);
            }
            schemas.add(getSchema(s, DataType.STRING));
        }
        schemaDTO.setItems(schemas);
        return schemaDTO;
    }

    private void dealWithArray(String value, ParameterDTO parameterDTO) {
        if (value.contains("&")) {
            parameterDTO.setStyle(ParamStyle.FORM);
            parameterDTO.setExplode(true);
            parameterDTO.setSchema(getSchema(value.replace('&', ','), DataType.ARRAY));
        } else if (value.contains(",")) {
            parameterDTO.setStyle(ParamStyle.FORM);
            parameterDTO.setExplode(false);
            parameterDTO.setSchema(getSchema(value, DataType.ARRAY));
        } else if (value.contains("|")) {
            parameterDTO.setStyle(ParamStyle.PIPE_DELIMITED);
            parameterDTO.setExplode(false);
            parameterDTO.setSchema(getSchema(value.replace('|', ','), DataType.ARRAY));
        } else if (value.contains(" ")) {
            parameterDTO.setStyle(ParamStyle.SPACE_DELIMITED);
            parameterDTO.setExplode(false);
            parameterDTO.setSchema(getSchema(value.replace(' ', ','), DataType.ARRAY));
        }
    }

    private DataType getType(Object obj) {
        if (obj instanceof Integer) {
            return DataType.INTEGER;
        } else if (obj instanceof Number) {
            return DataType.NUMBER;
        } else if (obj instanceof Boolean) {
            return DataType.BOOLEAN;
        } else if (obj instanceof String) {
            return DataType.STRING;
        } else if (obj instanceof List<?>) {
            return DataType.ARRAY;
        } else if (obj instanceof Map<?, ?>) {
            return DataType.OBJECT;
        }
        return null;
    }

    private static class Tree {
        private final List<Node> nodes;

        public Tree() {
            nodes = new ArrayList<>();
        }

        public void insert(String rawKey, String value) {
            String key = rawKey.substring(0, rawKey.indexOf("["));
            if (keyExists(key)) {
                Node node = find(key);
                add(node, rawKey, value);
            } else {
                Node node = new Node(key);
                nodes.add(node);
                add(node, rawKey, value);
            }
        }

        private Node find(String key) {
            for (Node node : nodes) {
                if (node.getKey().equals(key)) return node;
            }
            return new Node(key);
        }

        private boolean keyExists(String key) {
            for (Node node : nodes) {
                if (node.getKey().equals(key)) return true;
            }
            return false;
        }

        private void add(Node node, String rawKey, String value) {
            if (!rawKey.contains("[")) {
                node.setKey(rawKey);
                node.setValue(value);
            } else {
                rawKey = rawKey.substring(rawKey.indexOf("[") + 1);
                rawKey = rawKey.replaceFirst("]", "");
                if (!rawKey.contains("[")) {
                    Node field = new Node(rawKey, value);
                    node.getFields().add(field);
                } else {
                    String newKey = rawKey.substring(0, rawKey.indexOf("["));
                    Node field;
                    if (node.isField(newKey)) {
                        field = node.find(newKey);
                    } else {
                        field = new Node(newKey);
                        node.getFields().add(field);
                    }
                    add(field, rawKey, value);
                }
            }
        }

        public List<Node> getNodes() {
            return nodes;
        }
    }

    private static class Node {
        private String key;
        private String value;
        private List<Node> fields;

        public Node(String key, String value) {
            this.key = key;
            this.value = value;
            fields = new ArrayList<>();
        }

        public Node(String key) {
            this(key, null);
        }

        public boolean isField(String key) {
            for (Node g : fields) {
                if (g.key.equals(key)) return true;
            }
            return false;
        }

        public Node find(String key) {
            for (Node g : fields) {
                if (g.key.equals(key)) return g;
            }
            return null;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public List<Node> getFields() {
            return fields;
        }

        public void setFields(List<Node> fields) {
            this.fields = fields;
        }
    }
}
