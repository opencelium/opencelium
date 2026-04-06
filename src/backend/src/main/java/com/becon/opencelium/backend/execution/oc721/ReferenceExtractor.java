package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.execution.ExecutionManager;
import com.becon.opencelium.backend.reference.ReferenceParser;
import com.becon.opencelium.backend.reference.enums.ExchangeType;
import com.becon.opencelium.backend.reference.model.DirectReference;
import com.becon.opencelium.backend.reference.model.EnhancementReference;
import com.becon.opencelium.backend.reference.model.PageReference;
import com.becon.opencelium.backend.reference.model.Reference;
import com.becon.opencelium.backend.reference.model.RequestDataReference;
import com.becon.opencelium.backend.reference.model.WebhookReference;
import com.becon.opencelium.backend.reference.model.WrappedDirectReference;
import com.becon.opencelium.backend.resource.execution.ResponseEx;
import com.becon.opencelium.backend.utility.MediaTypeUtility;
import com.becon.opencelium.backend.reference.utility.ReferenceUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jakarta.annotation.Nullable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.reference.utility.ReferenceUtility.ARRAY_LETTER_INDEX_PATTERN;
import static com.becon.opencelium.backend.reference.utility.ReferenceUtility.FOR_IN_KEY_PATTERN;
import static com.becon.opencelium.backend.reference.utility.ReferenceUtility.FOR_IN_VALUE_PATTERN;
import static com.becon.opencelium.backend.reference.utility.ReferenceUtility.SPLIT_STRING_PATTERN;
import static com.becon.opencelium.backend.utility.Comparators.NUMERIC_PARTS;

public class ReferenceExtractor implements Extractor {
    private final ExecutionManager executionManager;

    public ReferenceExtractor(ExecutionManager executionManager) {
        this.executionManager = executionManager;
    }

    /**
     * Resolves a single reference expression.
     *
     * <ul>
     *   <li>{@code null} input → {@code null}</li>
     *   <li>Valid reference → resolved value</li>
     *   <li>Non-reference input → {@link IllegalArgumentException}</li>
     * </ul>
     *
     * <p>This method is on a hot path. Parsing and dispatch are optimized
     * to avoid unnecessary allocations and exceptions.
     */
    @Override
    public Object extractValue(@Nullable String rawReference) {
        if (rawReference == null) {
            return null;
        }

        try {
            return doExtract(rawReference);
        } catch (Exception e) {
            throw new RuntimeException("Failed to resolve reference = %s. Reason = %s".formatted(rawReference, e.getMessage()), e);
        }
    }


    private Object doExtract(String rawReference) {
        Reference reference = ReferenceParser.parse(rawReference);

        return switch (reference.getType()) {
            case DIRECT -> extractFromOperation((DirectReference) reference);

            case WRAPPED_DIRECT -> {
                WrappedDirectReference wdr = (WrappedDirectReference) reference;
                yield extractFromOperation(wdr.getDirectReference());
            }

            case ENHANCEMENT -> executionManager.executeScript(
                    ((EnhancementReference) reference).getBindId()
            );

            case WEBHOOK -> extractFromWebhook((WebhookReference) reference);

            case PAGE -> executionManager.getPaginationParamValue(
                    ((PageReference) reference).getPageParam()
            );

            case REQUEST_DATA -> {
                RequestDataReference rdr = (RequestDataReference) reference;
                yield executionManager
                        .getRequestData(rdr.getCtorId())
                        .getOrDefault(rdr.getKey(), rdr.getRaw());
            }
        };
    }

    private Object extractFromWebhook(WebhookReference ref) {
        Map<String, Object> webhookVars = executionManager.getWebhookVars();
        if (webhookVars == null || webhookVars.isEmpty()) {
            return null;
        }

        Object value = getFromJSON(webhookVars, ref.getPath());
        return mapToType(value, ref.getDataType());
    }

    private Object mapToType(Object value, DataType type) {
        if (value == null) {
            return null;
        }

        String stringValue = value.toString();
        return switch (type) {
            case INTEGER -> Long.parseLong(stringValue);
            case BOOLEAN -> Boolean.parseBoolean(stringValue);
            case NUMBER -> Double.parseDouble(stringValue);
            case STRING -> stringValue.replace("[", "").replace("]", "")
                    .replace("'", "");
            case ARRAY -> {
                String cleanedString = stringValue.replace("[", "").replace("]", "")
                        .replace("\"", "").replace("'", "").trim();
                if (cleanedString.isEmpty()) {
                    yield Collections.emptyList();
                } else {
                    yield Arrays.asList(cleanedString.split("\\s*,\\s*"));
                }
            }
            case UNDEFINED, OBJECT -> value;
        };
    }

    private Object extractFromOperation(DirectReference ref) {
        // find operation by color
        Operation operation = executionManager.findOperationByColor(ref.getColor())
                .orElseThrow(() -> new RuntimeException("There is no Operation with '" + ref.getColor() + "'"));

        final String path = ref.getPath();

        // CASE 1: collect all data from Operation, there are 4 sub-cases
        //   CASE 1.1: '#ababab.(response).[*]'
        //   CASE 1.2: '#ababab.(response).[*].status'
        //   CASE 1.3: '#ababab.(response).[*].header'
        //   CASE 1.4: '#ababab.(response).[*].body'

        if (ref.getPart() == DirectReference.Part.ALL) {
            if (path == null) { // CASE 1.1
                TreeMap<String, ResponseEx> responses = new TreeMap<>(NUMERIC_PARTS);
                operation.getResponses().forEach((K, V) -> responses.put(K, ResponseEx.of(V)));

                return responses;
            }

            // collect only specified response part, can be in ['header', 'status', 'body']
            if ("status".equals(path)) { // CASE 1.2
                TreeMap<String, Integer> statuses = new TreeMap<>(NUMERIC_PARTS);

                operation.getResponses().forEach((K, V) -> statuses.put(K, V.getStatusCode().value()));

                return statuses;
            }

            if ("header".equals(path)) { // CASE 1.3
                TreeMap<String, Map<String, List<String>>> headers = new TreeMap<>(NUMERIC_PARTS);

                operation.getResponses().forEach((K, V) -> headers.put(K, V.getHeaders()));

                return headers;
            }

            if ("body".equals(path)) { // CASE 1.4
                TreeMap<String, Object> bodies = new TreeMap<>(NUMERIC_PARTS);

                operation.getResponses().forEach((K, V) -> bodies.put(K, V.getBody()));

                return bodies;
            }
        }

        // at this point we work on a specific HttpEntity (Response or Request)
        String key = executionManager.generateKey(operation.getLoopDepth());

        // CASE 2: '#ababab.(response).status'         - return 'status' code of ResponseEntity
        if (ref.getPart() == DirectReference.Part.STATUS) {
            return operation.getResponses().get(key).getStatusCode().value();
        }

        final HttpEntity<?> entity;
        if (ref.getExchangeType() == ExchangeType.RESPONSE) {
            entity = operation.getResponses().get(key);
        } else {
            entity = operation.getRequests().get(key);
        }

        // CASE 3: return 'header' value of HttpEntity
        // ex.1) '#ababab.(response).header.$.Content-Type',
        // ex.2) '#ababab.(request).header.$.Content-Type',
        if (ref.getPart() == DirectReference.Part.HEADER) {
            return getFromHeader(entity.getHeaders(), path);
        }

        // CASE 4: has 4 sub-cases
        //   CASE 4.1: FOR_IN operator
        //   CASE 4.2: SPLIT_STRING operator
        //   CASE 4.3: FOR operator
        //   CASE 4.4: regular json path
        // We can also mix several of these cases
        Object body = entity.getBody();
        MediaType mediaType = entity.getHeaders().getContentType();

        if (MediaTypeUtility.isJsonCompatible(mediaType)) {
            return getFromJSON(body, path);
        } else if (MediaTypeUtility.isXmlCompatible(mediaType)) {
            return getFromXML(body, path);
        } else {
            return bodyToString(body);
        }
    }

    public static String bodyToString(Object body) {
        if (body instanceof String result) {
            return result;
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Object getFromHeader(HttpHeaders headers, String path) {
        if (headers == null || path == null || path.isBlank()) {
            return "";
        }

        String headerName = path;
        Integer index = null;
        boolean allValues = false;

        if (path.endsWith("[*]")) {
            headerName = path.substring(0, path.length() - 3);
            allValues = true;
        } else {
            int start = headerName.lastIndexOf('[');
            int end = headerName.lastIndexOf(']');

            if (start > 0 && end == headerName.length() - 1) {
                try {
                    index = Integer.parseInt(headerName.substring(start + 1, end));
                    headerName = headerName.substring(0, start);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        List<String> values = headers.get(headerName);

        if (values == null || values.isEmpty()) {
            return allValues ? Collections.emptyList() : "";
        }

        if (allValues) {
            return List.copyOf(values);
        }

        if (index != null) {
            return index < values.size() ? values.get(index) : "";
        }

        return headers.getFirst(headerName);
    }

    private Object getFromJSON(Object body, String paths) {
        Object result = body;

        // recursively read json
        for (String path : ReferenceUtility.splitPaths(paths)) {
            if (path.isEmpty()) {
                continue;
            }

            // replace invalid reference part if exists
            path = path.replace("[]", "[*]");

            // CASE 4.1: FOR_IN operator, there are 2 sub-cases
            //   CASE 4.1.1: index types for KEY(s), there are 3 sub-cases:
            //     CASE 4.1.1.1: obj['i']~            - field name on ith index (indexing starts from 0)
            //     CASE 4.1.1.2: obj['*']~            - all field names
            //     CASE 4.1.1.3: obj['field_name']~   - field_name itself
            Matcher keyMatcher = FOR_IN_KEY_PATTERN.matcher(path);
            if (keyMatcher.find()) { // FOR_IN for KEY(s) always comes last in path so after finding result just return
                String match = keyMatcher.group(1);

                if (Loop.isIterator(match)) { // CASE 4.1.1.1
                    // find loop by iterator, loop stores current value of the iterator
                    return getLoopByIterator(match).getValue();
                }

                if ("*".equals(match)) { // CASE 4.1.1.2
                    String pathToCurrentObject = path.replace(keyMatcher.group(0), ""); // just remove FOR_IN operators (comes always last)
                    Object currentObject = getFromJSON(result, pathToCurrentObject); // path might contain other operators, so continue calling method on result

                    return getFieldNames(currentObject);
                }

                return match; // CASE 4.1.1.3
            }

            // CASE 4.1.2: index types for VALUE(s), there are 2 sub-cases:
            //   CASE 4.1.2.1: obj['i']             - value of the field on ith index (indexing starts from 0)
            //   CASE 4.1.2.2: obj['field_name']    - value of the field by its name
            Matcher valueMatcher = FOR_IN_VALUE_PATTERN.matcher(path);
            while (valueMatcher.find()) {
                String match = valueMatcher.group(1);
                String fieldName = Loop.isIterator(match)
                        ? getLoopByIterator(match).getValue() // CASE 4.1.2.1
                        : match; // CASE 4.1.2.2

                // FOR_IN type for VALUE(s) is supported by library so just build the correct path
                // it will be resolved in CASE 4.4
                path = path.replace("['" + match + "']", "['" + fieldName + "']");
            }

            // CASE 4.2: SPLIT_STRING operator, there are 3 sub-cases
            //   CASE 4.2.1: field[i]~                  - string on the ith index (indexing starts from 0)
            //   CASE 4.2.2: field[*]~                  - all strings (after splitting)
            //   CASE 4.2.3: field[2]~                  - string on the 2nd index (indexing starts from 0)
            Matcher splitMatcher = SPLIT_STRING_PATTERN.matcher(path);
            if (splitMatcher.find()) { // SPLIT_STRING always comes last in path so after finding result just return
                String match = splitMatcher.group(1);

                if (Loop.isIterator(match)) { // CASE 4.2.1
                    return getLoopByIterator(match).getValue();
                }

                // find loop to get delimiter
                // NOTE. There will not be more than one loop for SPLIT_STRING
                Loop loop = getSplitStringLoop();

                String pathToCurrentString = path.replace(splitMatcher.group(0), ""); // just remove SPLIT_STRING operators (comes always last)
                Object currentString = getFromJSON(result, pathToCurrentString); // path might contain other operators, so continue calling method on result

                if ("*".equals(match)) { // CASE 4.2.2
                    return Arrays.asList(((String) currentString).split(loop.getDelimiter()));
                }

                // CASE 4.2.3
                int index = Integer.parseInt(match);
                return ((String) currentString).split(loop.getDelimiter())[index];
            }

            // CASE 4.3: FOR operator, there are 3 cases (2 of them is handled in CASE 4.4)
            //   CASE 4.3.1: array[i]                   - value on the ith index (indexing starts from 0)
            //   CASE 4.3.2: array[3]                   - value on the 3rd index (indexing starts from 0) (handled in CASE 4.4)
            //   CASE 4.3.3: array[*]                   - all values (handled in CASE 4.4)
            Matcher arrayMatcher = ARRAY_LETTER_INDEX_PATTERN.matcher(path);
            while (arrayMatcher.find()) { // CASE 4.3.1
                String iterator = arrayMatcher.group(1);
                String value = getLoopByIterator(iterator).getValue();
                path = path.replace("[" + iterator + "]", "[" + value + "]");
            }

            String jsonPath = (result instanceof List && !path.startsWith("[") ? "$[*]." : "$.") + path;
            result = JsonPath.read(bodyToString(result), jsonPath);
        }

        return result;
    }

    private Object getFromXML(Object body, String paths) {
        paths = paths.replaceFirst("\\$", "");
        String xpathQuery = "/";

        boolean hasLoop = !executionManager.getLoops().isEmpty();

        for (String part : ReferenceUtility.splitPaths(paths)) {
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

            if (result.isEmpty()) {
                return "";
            } else if (result.size() == 1) {
                return result.get(0);
            } else {
                return result;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Loop getLoopByIterator(String iterator) {
        return executionManager.getLoops().stream()
                .filter(loop -> Objects.equals(loop.getIterator(), iterator))
                .findFirst().orElseThrow(() -> new RuntimeException("Wrong 'iterator' value is supplied"));
    }

    private Loop getSplitStringLoop() {
        return executionManager.getLoops().stream()
                .filter(loop -> loop.getOperator() == RelationalOperator.SPLIT_STRING)
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
}
