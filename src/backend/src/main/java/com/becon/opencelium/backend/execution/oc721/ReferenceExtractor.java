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
    private static final ObjectMapper MAPPER = new ObjectMapper();

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
        Object normalizedWebhook = normalizeJsonDeep(webhookVars);
        Object value = getFromJSON(normalizedWebhook, ref.getPath());

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
            if (path.isBlank()) { // CASE 1.1
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
        String[] parts = ReferenceUtility.splitPaths(paths);

        if (parts.length == 0) {
            return body;
        }

        String last = parts[parts.length - 1];

        Matcher keyMatcher = FOR_IN_KEY_PATTERN.matcher(last);
        Matcher splitMatcher = SPLIT_STRING_PATTERN.matcher(last);

        boolean hasForInKey = keyMatcher.find();
        boolean hasSplit = splitMatcher.find();

        Object normalizedBody = normalizeJson(body);
        // C1: 'parts' contains values supported by JsonPath -> extract at once
        if (!hasForInKey && !hasSplit) {
            String resolvedPath = resolveLoops(paths);
            String jsonPath = toJsonPath(resolvedPath);

            return JsonPath.read(normalizedBody, jsonPath);
        }

        // C2: last element in 'parts' contains custom operator -> combine JsonPath supported 'part' into one,
        // then extract and resolve custom operator manually
        int customStart = -1;
        if (hasForInKey) {
            customStart = keyMatcher.start();
        } else if (hasSplit) {
            customStart = splitMatcher.start();
        }

        // last = items[i]['j']['k']~
        String baseLast = last.substring(0, customStart); // items[i]['j']
        String customPart = last.substring(customStart); // ['k']~

        String basePath;

        if (parts.length == 1) {
            basePath = baseLast;
        } else {
            String prefix = String.join(".", Arrays.copyOf(parts, parts.length - 1));
            basePath = baseLast.isEmpty() ? prefix : prefix + "." + baseLast;
        }

        basePath = resolveLoops(basePath);

        Object base;
        if (basePath.isEmpty()) {
            base = body;
        } else {
            String jsonPath = toJsonPath(basePath);
            base = JsonPath.read(normalizedBody, jsonPath);
        }

        if (hasForInKey) {
            Matcher m = FOR_IN_KEY_PATTERN.matcher(customPart);
            m.find();

            String match = m.group(1);

            if (Loop.isIterator(match)) {
                // obj['i']~ - field name on ith index
                return getLoopByIterator(match).getValue();
            }

            if ("*".equals(match)) {
                // obj['*']~ - all field names
                return getFieldNames(base);
            }

            // obj['field_name']~ - field_name itself
            return match;
        }

        // =========================
        // CASE 4.2: SPLIT_STRING operator
        //   CASE 4.2.1:
        //   CASE 4.2.2:
        //   CASE 4.2.3:
        // =========================
        if (hasSplit) {
            Matcher m = SPLIT_STRING_PATTERN.matcher(customPart);
            m.find();

            String match = m.group(1);

            if (Loop.isIterator(match)) {
                // field[i]~ - string on ith index
                return getLoopByIterator(match).getValue();
            }

            Loop loop = getSplitStringLoop();
            String str = (String) base;

            if ("*".equals(match)) {
                // field[*]~ - all strings
                return Arrays.asList(str.split(loop.getDelimiter()));
            }

            // field[2]~ - string on given index
            int index = Integer.parseInt(match);
            return str.split(loop.getDelimiter())[index];
        }

        return base;
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

    private Object normalizeJson(Object body) {
        if (body == null) return null;

        if (body instanceof Map || body instanceof List) {
            return body;
        }

        if (body instanceof String str) {
            try {
                return MAPPER.readValue(str, Object.class);
            } catch (Exception e) {
                throw new RuntimeException("Invalid JSON body", e);
            }
        }

        return MAPPER.convertValue(body, Object.class);
    }

    private Object normalizeJsonDeep(Object input) {
        if (input == null) return null;

        if (input instanceof String str) {
            try {
                return MAPPER.readValue(str, Object.class);
            } catch (Exception e) {
                return str;
            }
        }

        if (input instanceof Map<?, ?> map) {
            Map<String, Object> result = new TreeMap<>();
            for (Map.Entry<?, ?> e : map.entrySet()) {
                result.put(String.valueOf(e.getKey()), normalizeJsonDeep(e.getValue()));
            }
            return result;
        }

        if (input instanceof List<?> list) {
            List<Object> result = new ArrayList<>();
            for (Object item : list) {
                result.add(normalizeJsonDeep(item));
            }
            return result;
        }

        return input;
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

    private String resolveLoops(String path) {
        if (path == null || path.isEmpty()) {
            return path;
        }

        Matcher arrayMatcher = ARRAY_LETTER_INDEX_PATTERN.matcher(path);
        while (arrayMatcher.find()) {
            // array[i]
            String iterator = arrayMatcher.group(1);
            String value = getLoopByIterator(iterator).getValue();
            path = path.replace("[" + iterator + "]", "[" + value + "]");
        }

        Matcher valueMatcher = FOR_IN_VALUE_PATTERN.matcher(path);
        while (valueMatcher.find()) {
            // obj['i']
            String match = valueMatcher.group(1);

            if (Loop.isIterator(match)) {
                String value = getLoopByIterator(match).getValue();
                path = path.replace("['" + match + "']", "['" + value + "']");
            }
        }

        // replace invalid array reference part if exists
        if (path.contains("[]")) {
            path = path.replace("[]", "[*]");
        }

        return path;
    }

    private String toJsonPath(String paths) {
        return paths.startsWith("[") || paths.isBlank()
                ? "$" + paths
                : "$." + paths;
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
