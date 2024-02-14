package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.util.ObjectUtils;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.queryParams;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;

public class ReferenceExtractor implements Extractor {
    private final ExecutionManager executionManager;

    public ReferenceExtractor(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public Object extractValue(String ref) {
        Object result = null;

        if (ref == null) {
            // we get this null value from statements of a Condition
        } else if (ref.matches(queryParams)) {
            // '${key}'
            // '${key.field[*]}'
            result = extractFromQueryParams(ref);
        } else if (ref.matches(requestData)) {
            // '{key}' - if we get data from currently executing connector
            // '{#ctorId.key}' - if we get data from another connector
            result = extractFromRequestData(ref);
        } else if (ref.matches(directRef)) {
            // '#ababab.(response).success.field[*]
            // '#ababab.(request).field[*]
            result = extractFromOperation(ref);
        } else if (ref.matches(enhancement)) {
            // '#{%unique_id%}'
            result = extractFromEnhancement(ref);
        }

        return result;
    }

    public static boolean isReference(String ref) {
        return ref != null && (ref.matches(directRef) || ref.matches(queryParams) || ref.matches(requestData) || ref.matches(enhancement));
    }

    private Object extractFromOperation(String ref) {
        String color = ref.substring(ref.indexOf('#'), ref.indexOf('.'));

        Operation operation = executionManager.findOperationByColor(color)
                .orElseThrow(() -> new RuntimeException("There is no Operation with '" + color + "'"));

        return operation.getValue(ref, executionManager.getLoops());
    }

    private Object extractFromEnhancement(String ref) {
        String bindId = ref.replace("#{%", "").replace("%}", "");
        return executionManager.executeScript(bindId);
    }

    private Object extractFromRequestData(String ref) {
        // remove curly braces
        String refValue = ref.replace("{", "").replace("}", "");

        // set id of required connector if exists
        Integer ctorId = null;
        if (refValue.startsWith("#")) {
            ctorId = Integer.valueOf(refValue.substring(1, refValue.indexOf(".")));
            refValue = refValue.substring(refValue.indexOf(".") + 1);
        }

        return executionManager.getRequestData(ctorId).get(refValue);
    }

    private Object extractFromQueryParams(String ref) {
        try {
            if (ObjectUtils.isEmpty(ref)) {
                return "";
            }

            Map<String, Object> queryParams = executionManager.getQueryParams();
            if (queryParams.isEmpty()) {
                return null;
            }

            // 'queryParam' is in <'key': 'value'> pair,
            // 'key' might contain desired type, and it might be in form of jsonPath
            // 'value' might also be single value or jsonObject
            String requiredType = "";
            if (ref.contains(":")) {
                requiredType = ref.split(":")[1].replace("}", "");
                ref = ref.split(":")[0].concat("}");
            }

            // convert 'queryParams' to jsonString to work with both
            // single value and jsonObject cases at the same time
            String message = new ObjectMapper().writeValueAsString(queryParams);
            Pattern r = Pattern.compile(RegExpression.queryParams);
            Matcher m = r.matcher(ref);

            Object extractedValue = null;
            while (m.find()) {
                // convert 'queryParams' reference to jsonPath
                String jsonPath = "$." + m.group().replace("${", "").replace("}", "");

                extractedValue = JsonPath.read(message, jsonPath);
            }

            return requiredType.isBlank() ? mapToNumberIfPossible(extractedValue) : mapToType(extractedValue, requiredType);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException();
        }
    }

    private Object mapToType(Object value, String requiredType) {
        String stringValue = value.toString();

        if ("string".equalsIgnoreCase(requiredType)) {
            return stringValue.replace("[", "").replace("]", "").replace("'", "");
        }

        if ("int".equalsIgnoreCase(requiredType)) {
            return Long.parseLong(stringValue);
        }

        if ("double".equalsIgnoreCase(requiredType)) {
            return Double.parseDouble(stringValue);
        }

        if ("boolean".equalsIgnoreCase(requiredType)) {
            return Boolean.getBoolean(stringValue);
        }

        if ("array".equalsIgnoreCase(requiredType)) {
            return stringValue.replace("[", "")
                    .replace("]", "")
                    .replace("\"", "")
                    .replace("\'", "").split(",");
        }

        return value;
    }

    private Object mapToNumberIfPossible(Object value) {
        if (value == null) {
            return null;
        }

        String stringValue = value.toString();
        final Pattern pattern = Pattern.compile(RegExpression.isNumber, Pattern.MULTILINE);
        final Matcher matcher = pattern.matcher(stringValue);

        boolean isNumber = false;
        while (matcher.find()) {
            isNumber = true;
        }

        String optionalType = isNumber ? (stringValue.contains(".") ? "double" : "int") : "";

        return mapToType(value, optionalType);
    }
}
