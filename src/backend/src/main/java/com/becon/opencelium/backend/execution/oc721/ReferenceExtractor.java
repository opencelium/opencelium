package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.execution.ExecutionManager;
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
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;
import static com.becon.opencelium.backend.constant.RegExpression.enhancement;
import static com.becon.opencelium.backend.constant.RegExpression.queryParams;
import static com.becon.opencelium.backend.constant.RegExpression.requestData;
import static com.becon.opencelium.backend.constant.RegExpression.responsePointer;

public class ReferenceExtractor implements Extractor {

    private static final String IS_FOR_IN_KEY_TYPE = "\\['(.*?)\\']~";
    private static final String IS_FOR_IN_VALUE_TYPE = "\\['(.*?)\\']";
    private static final String IS_SPLIT_STRING_TYPE = "\\[([a-z0-9*]+)\\]~";
    private static final String ARRAY_LETTER_INDEX = "\\[([a-z])\\]";


    private final ExecutionManager executionManager;

    public ReferenceExtractor(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    @Override
    public Object extractValue(String ref) {
        Object result = null;

        if (ref.matches(directRef) || ref.matches(responsePointer)) {
            // extract direct reference if necessary
            // '{%#ababab.(response).success.field[*]%}'
            if (ref.startsWith("{%") && ref.endsWith("%}")) {
                ref = ref.substring(2, ref.length() - 2);
            }

            // '#ababab.(response).success.field[*]
            // '#ababab.(request).field[*]
            result = extractFromOperation(ref);
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
        } else if (ref.matches(enhancement)) {
            // '#{%bindId%}'
            result = extractFromEnhancement(ref);
        }

        return result;
    }

    public static boolean isReference(String ref) {
        return ref != null && (ref.matches(directRef) || ref.matches(responsePointer) ||
                               ref.matches(queryParams) || ref.matches(requestData) || ref.matches(enhancement));
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
                    .replace("'", "").split(",");
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
        String key = executionManager.generateKey(operation.getLoopDepth());

        Object entityBody;
        MediaType mediaType;

        if (exchangeType.equals("response")) {
            ResponseEntity<?> responseEntity = operation.getResponses().get(key);

            mediaType = responseEntity.getHeaders().getContentType();
            entityBody = responseEntity.getBody();
        } else {
            RequestEntity<?> requestEntity = operation.getRequests().get(key);

            mediaType = requestEntity.getHeaders().getContentType();
            entityBody = requestEntity.getBody();
        }

        Object result;

        if (MediaType.APPLICATION_JSON.isCompatibleWith(mediaType)) {
            result = getFromJSON(entityBody, ref);
        } else if (MediaType.APPLICATION_XML.isCompatibleWith(mediaType)) {
            result = getFromXML(entityBody, ref);
        } else {
            result = bodyToString(entityBody);
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

    private Object getFromJSON(Object body, String ref) {
        Object result = body;
        int partCount = 0;

        // creating json path query
        for (String path : getReferenceParts(ref)) {
            partCount++;
            if (path.isEmpty()) {
                continue;
            }

            // replace invalid reference part if exists
            path = path.replace("[]", "[*]");

            Pattern pattern;
            Matcher matcher;

            // CASE 1: FOR_IN operator
            // CASE 1.1: index types for KEY(s), there are 3 types:
            // 1) obj['i']~            - field name on ith index (indexing starts from 0)
            // 3) obj['*']~            - all field names
            // 4) obj['field_name']~   - field_name by this fields' name

            pattern = Pattern.compile(IS_FOR_IN_KEY_TYPE);
            matcher = pattern.matcher(path);

            if (matcher.find()) {
                // 'field name' is a primitive type value so path will not continue further
                // thus just return required value(s)

                String match = matcher.group(1);

                if (isLetter(match)) {
                    // case 1.1.1: obj['i']~
                    // find loop by its iterator
                    Loop loop = getLoopByIterator(match);

                    // return iterators' current value from loop
                    return loop.getValue();
                } else if ("*".equals(match)) {
                    // case 1.1.2: obj['*']~
                    // return all field names of the current object
                    Object currentBody = getFromJSON(body, getPointerToBody(ref, partCount, matcher.group(0)));
                    return getFieldNames(currentBody);
                } else {
                    // case 1.1.3: obj['field_name']~
                    // return just match itself
                    return match;
                }
            }

            // CASE 1.2: index types for VALUE(s), there are 2 types:
            // 1) obj['i']             - value of the field on ith index (indexing starts from 0)
            // 2) obj['field_name']    - value of the field by its name

            pattern = Pattern.compile(IS_FOR_IN_VALUE_TYPE);
            matcher = pattern.matcher(path);

            while (matcher.find()) {
                String match = matcher.group(1);
                String fieldName;

                if (isLetter(match)) {
                    // case 1.2.1: obj['i']
                    // find loop by its iterator
                    Loop loop = getLoopByIterator(match);

                    // get current fields' name from loop
                    fieldName = loop.getValue();
                } else {
                    // case 1.2.2: obj['field_name']
                    fieldName = match;
                }

                path = path.replace("['" + match + "']", "['" + fieldName + "']");
            }

            // CASE 2: SPLIT STRING operator, there are 3 cases
            // 1) field[i]~            - string on the ith index (indexing starts from 0)
            // 2) field[*]~            - all strings (after splitting)
            // 3) field[2]~            - string on the 2nd index (indexing starts from 0)

            pattern = Pattern.compile(IS_SPLIT_STRING_TYPE);
            matcher = pattern.matcher(path);

            while (matcher.find()) {
                String match = matcher.group(1);

                if (isLetter(match)) {
                    // case 2.1: field[i]~
                    // find loop by its iterator
                    Loop loop = getLoopByIterator(match);

                    // it is a primitive value so just return iterators' current value from loop
                    return loop.getValue();
                } else if ("*".equals(match)) {
                    // case 2.3: field[*]~
                    // find loop by reference
                    Loop loop = getLoopByReference(ref);

                    // recreate list of strings split by delimiter
                    List<String> strs = new ArrayList<>();
                    Collections.addAll(strs, ((String) result).split(loop.getDelimiter()));

                    result = strs;
                } else {
                    // case 2.2: field[2]~
                    int index;
                    try{
                        index = Integer.parseInt(match);
                    } catch (Exception e) {
                        throw new RuntimeException("Wrong index is supplied to a SPLIT STRING operator, 'index' = " + match);
                    }

                    // find loop by reference
                    Loop loop = getLoopByReference(ref);

                    // it is a primitive value just return string on the specified index
                    return ((String) result).split(loop.getDelimiter())[index];
                }
            }

            // CASE 3: FOR operator, there are 3 cases (2 of them is dealt automatically)
            // 1) array[i]~            - value on the ith index (indexing starts from 0)
            // 2) array[3]~            - value on the 3rd index (indexing starts from 0) (DONE by library)
            // 3) array[*]~            - all values (DONE by library)

            pattern = Pattern.compile(ARRAY_LETTER_INDEX);
            matcher = pattern.matcher(path);

            while (matcher.find()) {
                String iterator = matcher.group(1);

                // find loop by its iterator
                Loop loop = getLoopByIterator(iterator);

                // replace iterator with its current number value
                path = path.replace("[" + iterator + "]", "[" + loop.getValue() + "]");
            }

            String jsonPath = (result instanceof List && !path.startsWith("[") ? "$[*]." : "$.") + path;
            result = JsonPath.read(bodyToString(result), jsonPath);
        }

        return result;
    }

    private Object getFromXML(Object body, String ref) {
        ref = ref.replaceFirst("\\$", "");
        String xpathQuery = "/";

        boolean hasLoop = !executionManager.getLoops().isEmpty();

        for (String part : getReferenceParts(ref)) {
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

            if ((part.contains("[]") || hasIndex) && hasLoop) {
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + iterator + "]", "");
                }

                part = part + "[" + (getLoopByIterator(iterator).getIndex() + 1) + "]";
            } else if ((part.contains("[]") || part.contains("[*]")) && !hasLoop) {
                part = part.contains("[*]") ? part : part.replace("[]", "") + "[*]";
            }

            xpathQuery += "/" + part;
        }

        xpathQuery = xpathQuery.replace("/__oc__value", "");
        xpathQuery = xpathQuery.replace("/__oc__attributes", "");

        try {
            XPath xpath = XPathFactory.newInstance().newXPath();

            List<String> cpart = Arrays.asList(xpathQuery.split("/"));

            String lastElem = cpart.get(cpart.size() - 1);
            if (!lastElem.contains("@") && !(lastElem.contains("[*]") || lastElem.contains("[]"))) {
                xpathQuery = xpathQuery + "/text()";
            }

            // convert 'body' to XML Document
            String xmlString = (String) body;
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

    private static String[] getReferenceParts(String ref) {
        if (ref.isEmpty()) {
            return new String[]{""};
        }

        String[] refParts = ref.split("\\.");
        int from = 2;

        if (getExchangeType(ref).equals("response")) {
            from++;
        }

        return Arrays.copyOfRange(refParts, from, refParts.length);
    }

    private static String getPointerToBody(String ref, int partCount, String remove) {
        partCount += 1;

        if (getExchangeType(ref).equals("response")) {
            partCount++;
        }

        String[] refParts = ref.split("\\.");
        String result = "";
        for (int i = 0; i < partCount; i++) {
            result += refParts[i] + ".";
        }

        result += refParts[partCount].replace(remove, "");

        return result;
    }

    private Loop getLoopByIterator(String iterator) {
        return executionManager.getLoops().stream()
                .filter(loop -> Objects.equals(loop.getIterator(), iterator))
                .findFirst().orElseThrow(() -> new RuntimeException("Wrong 'iterator' value is supplied"));
    }

    private Loop getLoopByReference(String reference) {
        return executionManager.getLoops().stream()
                .filter(loop -> loop.hasSameRef(reference))
                .findFirst().orElseThrow(() -> new RuntimeException("Wrong 'reference' value is supplied"));
    }

    private List<String> getFieldNames(Object body) {
        List<String> result = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonObject = mapper.writeValueAsString(body);

            Iterator<String> fieldNames = mapper.readTree(jsonObject).fieldNames();
            while (fieldNames.hasNext()) {
                result.add(fieldNames.next());
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return result;
    }

    private boolean isLetter(String str) {
        return str != null && str.length() == 1 && Character.isLetter(str.charAt(0));
    }
}
