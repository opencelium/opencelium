package com.becon.opencelium.backend.database.mongodb.service.converter;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Component
public class OperationConverter {
    private final InvokerService invokerService;

    public OperationConverter(@Qualifier("invokerServiceImp") InvokerService invokerService) {
        this.invokerService = invokerService;
    }

    public OperationDTO toOperation(MethodMng method) {
        MediaType mediaType = MediaType.valueOf(method.getRequest().getHeader().get("Content-Type"));
        OperationDTO operationDTO = new OperationDTO();
        operationDTO.setOperationId(method.getColor());
        operationDTO.setHttpMethod(HttpMethod.valueOf(method.getRequest().getMethod()));
        operationDTO.setName(method.getName());
        operationDTO.setPath(method.getRequest().getEndpoint());
        operationDTO.setExecOrder(method.getIndex());
        operationDTO.setRequestBody(getRequestBody(method.getRequest().getBody(), mediaType));
        operationDTO.setParameters(getParameters(method.getRequest(), mediaType));
        return operationDTO;
    }

    private List<ParameterDTO> getParameters(RequestMng request, MediaType mediaType) {
        //header params
        List<ParameterDTO> parameters = getHeaderParameters(request.getHeader(), mediaType);

        UriComponents uriComponents = UriComponentsBuilder.fromUriString(request.getEndpoint()).build();
        int index = request.getEndpoint().indexOf("?");
        if(index!=-1){
            String query = request.getEndpoint().substring(index+1);
            parameters.addAll(getQueryParameters(query, mediaType));
        }
        //adding path params
        String path = uriComponents.getPath();
        parameters.addAll(getPathParameters(path, mediaType));

        //should be added cookies params

        return parameters;
    }

    private List<ParameterDTO> getHeaderParameters(Map<String, String> header, MediaType mediaType) {
        ArrayList<ParameterDTO> parameters = new ArrayList<>();

        for (Map.Entry<String, String> entry : header.entrySet()) {
            ParameterDTO parameterDTO = new ParameterDTO();
            parameterDTO.setName(entry.getKey());
            parameterDTO.setIn(ParamLocation.HEADER);
            parameterDTO.setStyle(ParamStyle.SIMPLE);
            parameterDTO.setContent(mediaType);

            String value = entry.getValue();
            if (value == null || value.isBlank())
                return parameters;

            String[] split = value.split(",");

            boolean explode = false; //it may be changed when the parameter is object
            if (split.length == 1) {
                parameterDTO.setSchema(getSchema(value, DataType.STRING));
            }//for primitive
            else if (split[0].contains("=")) {
                explode = true;
                SchemaDTO schemaDTO = new SchemaDTO();
                schemaDTO.setType(DataType.OBJECT);
                Map<String, SchemaDTO> map = new HashMap<>();
                for (String s : split) {
                    String[] pairs = s.split("=");
                    map.put(pairs[0], getSchema(pairs[1], DataType.STRING));
                }
                schemaDTO.setProperties(map);
                parameterDTO.setSchema(schemaDTO);
            }//for objects
            else {
                parameterDTO.setSchema(getSchema(value, DataType.ARRAY));
            }//for array
            parameterDTO.setExplode(explode);
            parameters.add(parameterDTO);
        }
        return parameters;
    }

    private List<ParameterDTO> getPathParameters(String path, MediaType mediaType) {
        if (path == null || !path.matches(".*\\{#.+}.*")) {
            return Collections.emptyList();
        } else {
            List<ParameterDTO> list = new ArrayList<>();
            String[] split = path.split("/");
            for (String s : split) {
                if (s.matches("\\{#.+}")) {
                    ParameterDTO parameterDTO = new ParameterDTO();
                    parameterDTO.setIn(ParamLocation.PATH);
                    parameterDTO.setName(s.substring(1, s.length() - 1));
                    parameterDTO.setStyle(ParamStyle.SIMPLE);
                    parameterDTO.setContent(mediaType);
                    parameterDTO.setSchema(getSchema(s.substring(1, s.length() - 1), DataType.STRING));
                    list.add(parameterDTO);
                }
            }
            return list;
        }
    }

    private List<ParameterDTO> getQueryParameters(String query, MediaType mediaType) {
        if (query == null || query.trim().isBlank()) return Collections.emptyList();
        List<ParameterDTO> parameters = new ArrayList<>(); //stores all parameters
        HashMap<String, String> pairs = new HashMap<>(); //stores k,v pairs
        Tree objects = new Tree(); //data structure for storing and retrieve objects

        String[] pairsRaw = query.split("&"); //stores k,v pairs temporary
        for (String p : pairsRaw) {
            String[] split = p.split("=");
            pairs.merge(split[0], split[1], (oldV, newV) -> oldV + "&" + newV);
        }

        for (Map.Entry<String, String> entry : pairs.entrySet()) {
            ParameterDTO parameterDTO = new ParameterDTO();
//            String value = URLDecoder.decode(entry.getValue(), StandardCharsets.UTF_8);
            String value = entry.getValue().replace("%20", " ");
            if (entry.getKey().matches(".+[\\[.+\\]]")) {
                objects.insert(entry.getKey(), value);
                continue;
            }// if it is object passes it to ds to retrieve later
            else if (value.matches(".+[&|,\\s]+.*")) {
                dealWithArray(value, parameterDTO);
            }// if it is array deals with it
            else {
                parameterDTO.setStyle(ParamStyle.FORM);
                parameterDTO.setExplode(true);
                if (value.matches("\\{#.+}")) {
                    value = value.substring(1, value.length() - 1);
                }
                parameterDTO.setSchema(getSchema(value, DataType.STRING));
            }// if it isn't array and object then it is primitive(number,integer, boolean, string)

            parameterDTO.setName(entry.getKey());
            parameterDTO.setContent(mediaType);
            parameterDTO.setIn(ParamLocation.QUERY);
            parameters.add(parameterDTO);
        }
        //for objects
        ParameterDTO parameterDTO = new ParameterDTO();
        parameterDTO.setContent(mediaType);
        parameterDTO.setIn(ParamLocation.QUERY);
        parameterDTO.setStyle(ParamStyle.DEEP_OBJECT);
        parameterDTO.setExplode(true);
        for (Node node : objects.getNodes()) {
            parameterDTO.setName(node.getKey());
            parameterDTO.setSchema(getSchema(node));
            parameters.add(parameterDTO);
        }
        return parameters;
    }

    private RequestBodyDTO getRequestBody(BodyMng body, MediaType mediaType) {
        RequestBodyDTO requestBodyDTO = new RequestBodyDTO();
        requestBodyDTO.setContent(mediaType);
        requestBodyDTO.setSchema(getSchema(body));
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

    private SchemaDTO getSchema(BodyMng body) {
        if (body == null || body.getFields() == null) return null;
        Map<String, Object> fields = body.getFields();
        SchemaDTO schemaDTO = new SchemaDTO();
        if (Objects.equals(body.getType(), "array")) {
            schemaDTO.setType(DataType.ARRAY);
            List<SchemaDTO> elements = new ArrayList<>();
            for (Object value : fields.values()) {
                elements.add(getSchemaFromObject(value));
            }
            schemaDTO.setItems(elements);
        } else {
            schemaDTO.setType(DataType.OBJECT);
            Map<String, SchemaDTO> props = new HashMap<>();
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                props.put(entry.getKey(), getSchemaFromObject(entry.getValue()));
            }
            schemaDTO.setProperties(props);
        }
        return schemaDTO;
    }

    private SchemaDTO getSchema(Node node) {

        SchemaDTO schemaDTO = new SchemaDTO();
        if (node.getValue() != null) {
            String value = node.getValue();
            if (value.matches("\\{#.+}")) {
                value = value.substring(1, value.length() - 1);
            }
            schemaDTO.setType(DataType.STRING);
            schemaDTO.setValue(value);
            return schemaDTO;
        }
        String firstKey = node.getFields().get(0).getKey();
        if (firstKey.matches("[\\d+]")) {
            if (schemaDTO.getItems() == null) {
                schemaDTO.setItems(new ArrayList<>());
            }
            for (Node field : node.getFields()) {
                schemaDTO.getItems().add(getSchema(field));
            }
            schemaDTO.setType(DataType.ARRAY);
        } else {
            for (Node field : node.getFields()) {
                if (schemaDTO.getProperties() == null) {
                    schemaDTO.setProperties(new HashMap<>());
                }
                schemaDTO.setType(DataType.OBJECT);
                schemaDTO.getProperties().put(field.getKey(), getSchema(field));
            }
        }
        return schemaDTO;
    }

    private SchemaDTO getSchemaFromObject(Object obj) {
        SchemaDTO schemaDTO = new SchemaDTO();
        DataType type = getType(obj);
        if (obj == null || type == null) return null;
        if (type == DataType.STRING) {
            String value = String.valueOf(obj);
            if (value.startsWith("#")) {
                schemaDTO.setType(DataType.valueOf(invokerService.findFieldType("", value).toUpperCase()));
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
                elements.add(getSchemaFromObject(item));
            }
            schemaDTO.setItems(elements);
        } else {
            @SuppressWarnings("unchecked") Map<String, ?> map = (Map<String, ?>) obj;
            schemaDTO.setType(DataType.OBJECT);
            Map<String, SchemaDTO> fields = new HashMap<>();
            for (Map.Entry<String, ?> entry : map.entrySet()) {
                fields.put(entry.getKey(), getSchemaFromObject(entry.getValue()));
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
            if (s.matches("\\{#.+}")) {
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
        } else if (obj instanceof Number){
            return DataType.NUMBER;
        }else if (obj instanceof Boolean) {
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
}