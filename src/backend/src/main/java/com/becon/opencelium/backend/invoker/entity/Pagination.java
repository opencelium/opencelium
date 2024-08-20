package com.becon.opencelium.backend.invoker.entity;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.enums.PageParamAction;
import com.becon.opencelium.backend.utility.MediaTypeUtility;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
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
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;


public class Pagination implements Cloneable {

    private List<PageParamRule> pageParamRules;
    private int currentSize;

    public Pagination(List<PageParamRule> pageParamRules) {
        this.pageParamRules = pageParamRules;
    }

    public List<PageParamRule> getPageParamRules() {
        return pageParamRules;
    }

    public String getParamValue(PageParam param) {
        return findParam(param).getValue();
    }

    public void changeParamValue(PageParam param, String newValue) {
        findParam(param).setValue(newValue);
    }

    public PageParamRule findParam(PageParam param) {
        return pageParamRules.stream().filter(p -> p.getParam() == param).findFirst()
                .orElseThrow(() -> new RuntimeException("Parameter \"" + param + "\" not found in pagination"));
    }

    public boolean existsParam(PageParam param) {
        return pageParamRules.stream().filter(p -> p.getParam() == param).findFirst()
                .orElse(null) != null;
    }

    public boolean hasMore() {
        this.currentSize = getCurrentSize();
        if (existsParam(PageParam.HAS_MORE)) {
            String result = findParam(PageParam.HAS_MORE).getValue();
            if (result != null && !result.isEmpty()) {
                return Boolean.parseBoolean(result);
            }
        }
        if (existsParam(PageParam.SIZE)) {
            int size = Integer.parseInt(getParamValue(PageParam.SIZE));
            return currentSize < size;
        }
        if (existsParam(PageParam.CURSOR)) {
            String result = findParam(PageParam.CURSOR).getValue();
            if (result == null || result.isEmpty()) {
                return false;
            }
        }
        if (existsParam(PageParam.LINK)) {
            String url = getParamValue(PageParam.LINK);
            if (!url.isEmpty()) {
                try {
                    URI uri = new URI(url);
                    return !uri.getRawQuery().contains("null");
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        }
        return false;
    }

    public int getCurrentSize() {
        PageParamRule paramRule = findParam(PageParam.RESULT);
        String payload = paramRule.getValue();
        String jsonPath = paramRule.getRefPath();
        this.currentSize = JsonPath.parse(payload).read( jsonPath + ".length()");
        return this.currentSize;
    }

    public void updateParamValues(ResponseEntity<?> response, Class<?> responseType) {
        boolean needConversion = true;
        if (response.getHeaders().getContentType() != null && !MediaTypeUtility.isJsonCompatible(response.getHeaders().getContentType())) {
            needConversion = false;
        } else if (responseType.equals(String.class)) {
            needConversion = false;
        }

        String body;
        if (needConversion) {
            try {
                body = new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(response.getBody());
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        } else {
            body = (String) response.getBody();
        }

        updateParamValues(new ResponseEntity<>(body, response.getHeaders(), response.getStatusCode()));
    }

    // TODO test for x-www-form-urlencoded
    private void updateParamValues(ResponseEntity<String> response) {
        HttpRepository httpRepository = new HttpRepository(response);
        pageParamRules.stream()
                .filter(paramRule -> paramRule.getRef() != null)
                .filter(paramRule -> paramRule.getRef().split("\\.",2)[0].equals("response"))
                .forEach(paramRule -> {
                    String value = httpRepository.findValueByPath(paramRule.getRef());
                    if (paramRule.getParam().equals(PageParam.RESULT)) {
                        if (paramRule.getValue() == null || paramRule.getValue().isEmpty()) {
                            paramRule.setValue(response.getBody());
                            return;
                        }
                        String path = paramRule.getRefPath();
                        String result = mergeArrayIntoObject(paramRule.getValue(), value, path);
                        paramRule.setValue(result);
                        return;
                    }
                    if (paramRule.getParam().equals(PageParam.PAGE)) {
                        if (paramRule.getAction().equals(PageParamAction.INCREMENT)) {
                            value = Integer.parseInt(value) + 1 + "";
                        }
                    }
                    if (paramRule.getParam().equals(PageParam.OFFSET)) {
                        if (paramRule.getAction().equals(PageParamAction.INCREMENT)) {
                            int limit = Integer.parseInt(findParam(PageParam.LIMIT).getValue());
                            value = Integer.parseInt(value) + limit + "";
                        }
                    }
                    paramRule.setValue(value);
                });

        // if ref is null
        pageParamRules.stream().filter(paramRule -> paramRule.getRef() == null)
                .forEach(paramRule -> {
                    String value = paramRule.getValue();
                    if (paramRule.getParam().equals(PageParam.PAGE)) {
                        if (paramRule.getAction().equals(PageParamAction.INCREMENT)) {
                            value = Integer.parseInt(value) + 1 + "";
                        }
                    }
                    if (paramRule.getParam().equals(PageParam.OFFSET)) {
                        if (paramRule.getAction().equals(PageParamAction.INCREMENT)) {
                            int limit = Integer.parseInt(findParam(PageParam.LIMIT).getValue());
                            value = Integer.parseInt(value) + limit + "";
                        }
                    }
                    paramRule.setValue(value);
                });
    }

    @Override
    public Pagination clone() {
        Pagination clone;
        try {
            clone = (Pagination) super.clone();
        } catch (CloneNotSupportedException e) {
            clone = new Pagination(this.pageParamRules.stream().map(PageParamRule::clone).collect(Collectors.toList()));
        }
        clone.pageParamRules = this.pageParamRules.stream().map(PageParamRule::clone).collect(Collectors.toList());
        return clone;
    }

    private static class HttpRepository {
        private final HttpHeaders headers;
        private final String payload;
        private URI uri;

        public HttpRepository(ResponseEntity<String> responseEntity) {
            this.headers = responseEntity.getHeaders();
            this.payload = responseEntity.getBody();
        }

        public HttpRepository(RequestEntity<String> requestEntity) {
            this.headers = requestEntity.getHeaders();
            this.payload = requestEntity.getBody();
            this.uri = requestEntity.getUrl();
        }

        // path: response.header.$.param
        public String findValueByPath(String path) {
            // determine second value after response or request
            String location = getRefPrefix(path).split("\\.")[1];
            String param = getRefSuffix(path);
            switch (location) {
                case "url":
                    if (uri == null || uri.getRawQuery() == null) break;
                    Map<String, String> queries = splitQuery(uri.getRawQuery());
                    return queries.get(param);
                case "header":
                    return headers.getFirst(param);
                case "body":
                    Object res = getValueFromBody(getRefPath(path));

                    if (res == null) {
                        return "";
                    }
                    return res.toString();
                default:
                    throw new RuntimeException(location + " not found in path " + path + ". Should be one of [header, url, body]");
            }
            return "";
        }

        private Object getValueFromBody(String jsonPath) {
            if (MediaTypeUtility.isJsonCompatible(headers.getContentType())) {
                return JsonPath.read(payload, jsonPath);
            } else {
                jsonPath = jsonPath.replaceFirst("\\$", ".");
                String xpathQuery = jsonPath.replace(".", "/");

                try {
                    XPath xpath = XPathFactory.newInstance().newXPath();

                    List<String> cpart = Arrays.asList(xpathQuery.split("/"));

                    String lastElem = cpart.get(cpart.size() - 1);
                    if (!lastElem.contains("@") && !(lastElem.contains("[*]") || lastElem.contains("[]"))) {
                        xpathQuery = xpathQuery + "/text()";
                    }

                    DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                    Document xmlDocument = builder.parse(new InputSource(new StringReader(payload)));

                    NodeList nodeList = (NodeList) xpath.compile(xpathQuery).evaluate(xmlDocument, XPathConstants.NODESET);
                    ArrayList<Object> result = new ArrayList<>();
                    for (int j = 0; j < nodeList.getLength(); j++) {
                        Node node = nodeList.item(j);
                        result.add(node.getNodeValue());
                    }

                    if (result.isEmpty()) {
                        return null;
                    } else if (result.size() == 1) {
                        return result.get(0);
                    } else {
                        return result;
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        }

        private String getRefSuffix(String ref) {
            return parseRef(index -> ref.substring(index + 3), ref);
        }

        private String getRefPath(String ref) {
            return parseRef(index -> ref.substring(index + 1), ref);
        }

        private String getRefPrefix(String ref) {
            return parseRef(index -> ref.substring(0, index), ref);
        }

        private String parseRef(Function<Integer, String> function, String ref){
            if (ref == null || ref.isEmpty()) {
                return "";
            }
            int index = ref.indexOf(".$");
            if (index != -1) {
                return function.apply(index);
            } else {
                return "";
            }
        }

        public static Map<String, String> splitQuery(String query) {
            try {
                Map<String, String> queryPairs = new HashMap<>();
                String[] pairs = query.split("&");
                for (String pair : pairs) {
                    int idx = pair.indexOf("=");
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8.toString());
                    String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8.toString());
                    queryPairs.put(key, value);
                }
                return queryPairs;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }

        }
    }

    public static String mergeArrayIntoObject(String obj, String arr, String jsonPath) {
        try {
            String jsonPointer = convertJSONPathToPointer(jsonPath);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(obj);
            ArrayNode arrNode = (ArrayNode) mapper.readTree(arr);
            JsonNode dataNode = rootNode.at(jsonPointer);

            if (dataNode instanceof ArrayNode) {
                ((ArrayNode) dataNode).addAll(arrNode);
            } else {
                throw new IllegalArgumentException("Path does not point to an array node");
            }
            return rootNode.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String convertJSONPathToPointer(String jsonPath) {
        if(jsonPath == null || jsonPath.isEmpty()) {
            return "";
        }

        // Remove the '$' prefix and replace '.' with '/'
        // Assumes a simple path without array indices or query filters
        String jsonPointer = jsonPath.trim().substring(1).replaceAll("\\.", "/");

        // Handle array indices by converting them to JSON Pointer format
        jsonPointer = jsonPointer.replaceAll("\\[(\\d+)\\]", "/$1");

        return jsonPointer;
    }
}
