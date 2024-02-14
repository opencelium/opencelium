package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
            // this happens if statement(s) is null in a Condition
        } else if (ref.matches(queryParams)) {
            // '${key}'
            // '${key:type}'
            // '${key.field[*]}'
            // '${key.field[*]:type}'
            result = extractFromQueryParams(ref);
        } else if (ref.matches(requestData)) {
            // '{key}'
            // '{#ctorId.key}'
            result = extractFromRequestData(ref);
        } else if (ref.matches(directRef)) {
            // '#ababab.(response).success.field[*]
            // '#ababab.(request).field[*]
            result = extractFromOperation(ref);
        } else if (ref.matches(enhancement)) {
            // '#{%bindId%}'
            result = extractFromEnhancement(ref);
        }

        return result;
    }

    public static boolean isReference(String ref) {
        return ref != null && (ref.matches(directRef) || ref.matches(queryParams) || ref.matches(requestData) || ref.matches(enhancement));
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
        if (ObjectUtils.isEmpty(ref)) {
            return "";
        }

        Map<String, Object> queryParams = executionManager.getQueryParams();
        if (queryParams.isEmpty()) {
            return null;
        }

        try {
            // get requiredType if specified, then update reference
            String type = "";
            if (ref.contains(":")) {
                type = ref.split(":")[1].replace("}", "");
                ref = ref.split(":")[0].concat("}");
            }

            // convert 'queryParams' to jsonString to work with both
            // single value and jsonObject cases at the same time
            String message = new ObjectMapper().writeValueAsString(queryParams);
            Pattern r = Pattern.compile(RegExpression.queryParams);
            Matcher m = r.matcher(ref);

            Object value = null;
            while (m.find()) {
                // convert 'queryParams' reference to jsonPath
                String jsonPath = "$." + m.group().replace("${", "").replace("}", "");

                value = JsonPath.read(message, jsonPath);
            }

            if (value == null) {
                return null;
            }

            return mapToType(value, type);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException();
        }
    }

    private Object mapToType(Object value, String type) {
        Object result;
        String stringValue = value.toString();

        if (type.isBlank()) {
            // map to number [int, double] if possible
            final Pattern pattern = Pattern.compile(RegExpression.isNumber, Pattern.MULTILINE);
            final Matcher matcher = pattern.matcher(stringValue);

            boolean isNumber = false;
            while (matcher.find()) {
                isNumber = true;
            }

            String optionalType = isNumber ? (stringValue.contains(".") ? "double" : "int") : "none";

            result = mapToType(value, optionalType);
        } else if ("string".equalsIgnoreCase(type)) {
            result = stringValue.replace("[", "").replace("]", "").replace("'", "");
        } else if ("int".equalsIgnoreCase(type)) {
            result = Long.parseLong(stringValue);
        } else if ("double".equalsIgnoreCase(type)) {
            result = Double.parseDouble(stringValue);
        } else if ("boolean".equalsIgnoreCase(type)) {
            result = Boolean.getBoolean(stringValue);
        } else if ("array".equalsIgnoreCase(type)) {
            result = stringValue.replace("[", "")
                    .replace("]", "")
                    .replace("\"", "")
                    .replace("\'", "").split(",");
        } else {
            result = value;
        }

        return result;
    }

    private Object extractFromOperation(String ref) {
        // find the operation by color
        String color = ref.substring(ref.indexOf('#'), ref.indexOf('.'));

        Operation operation = executionManager.findOperationByColor(color)
                .orElseThrow(() -> new RuntimeException("There is no Operation with '" + color + "'"));

        // extract value
        String exchangeType = getExchangeType(ref);
        String key = executionManager.generateKey();

        String entityBody;
        MediaType mediaType;

        if (exchangeType.equals("response")) {
            ResponseEntity<?> responseEntity = operation.getResponses().get(key);

            mediaType = responseEntity.getHeaders().getContentType();
            entityBody = bodyToString(responseEntity.getBody());
        } else {
            RequestEntity<?> requestEntity = operation.getRequests().get(key);

            mediaType = requestEntity.getHeaders().getContentType();
            entityBody = bodyToString(requestEntity.getBody());
        }

        Object result;

        if (MediaType.APPLICATION_JSON.isCompatibleWith(mediaType)) {
            result = getFromJSON(entityBody, ref, executionManager.getLoops());
        } else if (MediaType.APPLICATION_XML.isCompatibleWith(mediaType)) {
            result = getFromXML(entityBody, ref, executionManager.getLoops());
        } else {
            result = entityBody;
        }

        return result;
    }

    public static String bodyToString(Object body) {
        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Object getFromJSON(String jsonString, String ref, LinkedHashMap<String, String> loops) {
        String jsonPath = "$";
        String refValue = getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        boolean hasLoop = !loops.isEmpty();

        // creating json path query
        for (String part : conditionParts) {
            if (part.isEmpty()) {
                continue;
            }

            part = part.replace("[]", "[*]");

            // set current value of iterators: e.g. if i=3 -> ...field[i]... -> ...field[3]...
            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String iterator = "";

            while (m.find()) {
                hasIndex = true;
                iterator = m.group(1);
            }

            if ((part.contains("[]") || hasIndex) && hasLoop && !part.contains("[*]")) {
                part = part.replace("[]", ""); // remove [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + iterator + "]", "");
                }

                part = part + "[" + loops.get(iterator) + "]";
            } else if ((part.contains("[]") || part.contains("[*]")) && !hasLoop) {
                if (part.contains("[]")) {
                    part = part.replace("[]", "");
                    part = part + "[*]";
                }
            }

            jsonPath = jsonPath + "." + part;
        }

        return JsonPath.read(jsonString, jsonPath);
    }

    private Object getFromXML(String xmlString, String ref, LinkedHashMap<String, String> loops) {
        ref = ref.replaceFirst("\\$", "");

        String xpathQuery = "//";
        String refValue = ConditionUtility.getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        boolean hasLoop = !loops.isEmpty();

        for (String part : conditionParts) {
            if (part.isEmpty()) {
                continue;
            }

            part = part.contains(":") ? part.split(":")[1] : part;

            // increment and set current value of iterators: e.g. if i=3 -> ...field[i]... -> ...field[4]...
            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String iterator = "";

            while (m.find()) {
                hasIndex = true;
                iterator = m.group(1);
            }

            int xmlIndex = Integer.parseInt(loops.get(iterator)) + 1;
            if ((part.contains("[]") || hasIndex) && hasLoop) {
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + iterator + "]", "");
                }

                part = part + "[" + xmlIndex + "]";
            } else if ((part.contains("[]") || part.contains("[*]")) && !hasLoop) {
                part = part.contains("[*]") ? part : part.replace("[]", "") + "[*]";
            }

            xpathQuery = xpathQuery + part + "/";
        }

        // remove the last slash (/)
        xpathQuery = Optional.of(xpathQuery)
                .filter(str -> !str.isEmpty())
                .map(str -> str.substring(0, str.length() - 1))
                .orElse(xpathQuery);

        xpathQuery = xpathQuery.replace("/__oc__value", "");
        xpathQuery = xpathQuery.replace("/__oc__attributes", "");

        try {
            XPath xpath = XPathFactory.newInstance().newXPath();

            List<String> cpart = Arrays.asList(xpathQuery.split("/"));

            String lastElem = cpart.get(cpart.size() - 1);
            if (!lastElem.contains("@") && !(lastElem.contains("[*]") || lastElem.contains("[]"))) {
                xpathQuery = xpathQuery + "/text()";
            }

            // convert 'xmlString' to XML Document
            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document xmlDocument = builder.parse(new InputSource(new StringReader(xmlString)));

            NodeList nodeList = (NodeList) xpath.compile(xpathQuery).evaluate(xmlDocument, XPathConstants.NODESET);
            ArrayList<Object> result = new ArrayList<>();
            for (int j = 0; j < nodeList.getLength(); j++) {
                Node node = nodeList.item(j);
                // TODO currently it works if target is primitive type, otherwise we get only null
                result.add(node.getNodeValue());
            }

            if (result.size() == 1) {
                return result.get(0);
            } else {
                return result;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String getExchangeType(String ref){
        // extracts type from direct reference: #ffffff.(response | request). ...
        return ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));
    }

    private static String getRefValue(String ref) {
        if (ref.isEmpty()) {
            return "";
        }

        String[] refParts = ref.split("\\.");

        String result = ref.replace(refParts[0] + ".", "")
                .replace(refParts[1] + ".", "");

        if (getExchangeType(ref).equals("response")) {
            result = result.replace(refParts[2] + ".", "")
                    .replace(refParts[0], "")
                    .replace(refParts[1], "")
                    .replace(refParts[2], "");
        }

        return result;
    }
}
