package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ReferenceExtractor implements Extractor {
    private final ExecutionManager executionManager;

    public ReferenceExtractor(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public SchemaDTO extractValue(String ref) {
        SchemaDTO result = null;

        if (ref.matches(RegExpression.queryParams)) {
            result = extractValueFromQueryParams(ref);
        }

        if (ref.matches(RegExpression.requiredData)) {
            // TODO: implement required data
            result = null;
        }

        if (ref.matches(RegExpression.hasEnh)) {
            result = extractValueFromOperation(ref);
        }

        return result;
    }

    private SchemaDTO extractValueFromOperation(String ref) {
        if (ObjectUtils.isEmpty(ref)) {
            return new SchemaDTO(DataType.STRING, "");
        }

        String color = ref.substring(ref.indexOf('#'), ref.indexOf('.'));
        String exchangeType = ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));

        Operation operation = executionManager.findOperationByColor(color).orElseThrow(() -> new RuntimeException("There is no Operation with '" + color + "'"));
        if ("response".equalsIgnoreCase(exchangeType)) {
            Map<String, ResponseEntity<?>> responses = operation.getResponses();
            String key = constructKey(ref, exchangeType);

            ResponseEntity<?> response = responses.get(key);



        } else if ("request".equalsIgnoreCase(exchangeType)) {
            Map<String, RequestEntity<?>> requests = operation.getRequests();
            String key = constructKey(ref, exchangeType);

            RequestEntity<?> request = requests.get(key);



        }

        return null;
    }

    private String constructKey(String ref, String exchangeType) {
        // TODO add implementation
        return "#";
    }

    private SchemaDTO extractValueFromQueryParams(String ref) {
        try {
            if (ObjectUtils.isEmpty(ref)) {
                return new SchemaDTO(DataType.STRING, "");
            }

            Map<String, Object> queryParams = executionManager.getQueryParams();

            if (queryParams.isEmpty()) {
                return null;
            }
            // if 'ref' also has type then extract this type
            String type = "";
            if (ref.contains(":")) {
                type = ref.split(":")[1].replace("}", "");
                // correct 'ref' parameter to its' form
                ref = ref.split(":")[0].concat("}");
            }

            SchemaDTO result = null;

            // extract 'result' from query params
            String jsonString = new ObjectMapper().writeValueAsString(queryParams);
            Pattern pattern = Pattern.compile(RegExpression.queryParams);
            Matcher matcher = pattern.matcher(ref);

            while (matcher.find()) {
                String path = "$." + matcher.group().replace("${", "").replace("}", "");
                Object val = JsonPath.read(jsonString, path);
                result = convertToType(val, type);
            }

            return result;
        } catch (JsonProcessingException ex) {
            throw new RuntimeException(ex);
        }
    }

    private SchemaDTO convertToType(Object val, String type) {
        if (val == null) {
            return null;
        }

        String value = val.toString();
        // default type = STRING, value = val.toString()
        SchemaDTO result = new SchemaDTO(DataType.STRING, value);

        if (type.isEmpty()) {
            Pattern pattern = Pattern.compile(RegExpression.isNumber, Pattern.MULTILINE);
            Matcher matcher = pattern.matcher(value);

            boolean isNumber = false;
            while (matcher.find()) {
                isNumber = true;
            }

            if (isNumber && value.contains(".")) {
                result = new SchemaDTO(DataType.NUMBER, value);
            } else if (isNumber) {
                result = new SchemaDTO(DataType.INTEGER, value);
            }

            return result;
        }

        if (type.equalsIgnoreCase("string")) {
            String v = value.replace("[", "").replace("]", "").replace("'", "");
            result = new SchemaDTO(DataType.STRING, v);
        } else if (type.equalsIgnoreCase("int")) {
            result = new SchemaDTO(DataType.INTEGER, value);
        } else if (type.equalsIgnoreCase("double") || type.equalsIgnoreCase("float")) {
            result = new SchemaDTO(DataType.NUMBER, value);
        } else if (type.equalsIgnoreCase("array")) {
            String[] arr = value.replace("[", "")
                    .replace("]", "")
                    .replace("\"", "")
                    .replace("\'", "").split(",");

            List<SchemaDTO> items = Arrays.stream(arr).map(str -> convertToType(str, "")).toList();

            result = new SchemaDTO();
            result.setType(DataType.ARRAY);
            result.setItems(items);
        }

        return result;
    }
}
