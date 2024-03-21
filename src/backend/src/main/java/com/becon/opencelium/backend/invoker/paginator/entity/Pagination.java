package com.becon.opencelium.backend.invoker.paginator.entity;

import com.becon.opencelium.backend.invoker.paginator.enums.PageParam;
import com.becon.opencelium.backend.invoker.paginator.enums.PageParamAction;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.ReadContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
                .orElseThrow(() -> new RuntimeException("\"Parameter \\\"" + param + "\\\" not found in pagination\""));
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

    // example:  http://localhost:9090/api/@{var1}/path?offset=@{var2}
    // adds params if  reference is not null. works with query params
    public URI insertPageValue(URI uri) throws URISyntaxException {
        String url = uri.toString();
        for (PageParamRule paramRule : pageParamRules) {
            String ref = paramRule.getRef();
            if (ref == null) {
                continue;
            }
            PageParamAction action = paramRule.getAction();
            if (ref.contains("request.url.$")) {
                String param = paramRule.getRefSuffix();
                if (!action.equals(PageParamAction.WRITE)) {
                    continue;
                }
                url = uri.getRawQuery() == null ? url.concat("?" + param + "=" + paramRule.getValue())
                        : url.concat("&" + param + "=" + paramRule.getValue());
            }
        }
        return new URI(url);
    }

    // Works only with references. If reference is not null or empty then it inserts or reads.
    public void insertPageValue(HttpHeaders headers) {
        pageParamRules.stream().filter(paramRule -> paramRule.getRef() != null)
                .filter(paramRule -> paramRule.getRef().contains("request.header.$"))
                .filter(paramRule -> paramRule.getAction().equals(PageParamAction.WRITE))
                .forEach(paramRule -> {
                    String key = paramRule.getRefSuffix();
                    headers.add(key, paramRule.getValue());
                });
    }

    public String insertPageValue(String payload) {
        final String[] result = new String[1];
        pageParamRules.stream().filter(paramRule -> paramRule.getRef().equals("request.body.$"))
                .filter(paramRule -> paramRule.getAction().equals(PageParamAction.WRITE))
                .forEach(paramRule -> {
                    String path = paramRule.getRefPath();
                    // TODO: test for an array
                    // TODO: Add xml support
                    result[0] = JsonPath.parse(payload).set(path, paramRule.getValue()).json();
                });
        return result[0];
    }

    // TODO test for x-www-form-urlencoded
    public void updateParamValues(ResponseEntity<String> response) {
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
                    // TODO: Add xml support
                    ReadContext ctx = JsonPath.parse(payload);
                    Object res = ctx.read(getRefPath(path));
                    if (res == null) {
                        return "";
                    }
                    return res.toString();
                default:
                    throw new RuntimeException(location + " not found in path " + path + ". Should be one of [header, url, body]");
            }
            return "";
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
