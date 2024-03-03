package com.becon.opencelium.backend.invoker.paginator.entity;

import com.becon.opencelium.backend.invoker.paginator.enums.PageParam;
import com.becon.opencelium.backend.invoker.paginator.enums.PageParamAction;
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

    public void setCurrentSize(int current) {
        this.currentSize = current;
    }

    public int getCurrentSize() {
        return currentSize;
    }

    // example:  http://localhost:9090/api/@{var1}/path?offset=@{var2}
    // adds params if  reference is not null. works with query params
    public URI insertPageValue(URI uri) throws URISyntaxException {
        String url = uri.toString();
        for (PageParamRule paramRule : pageParamRules) {
            String ref = paramRule.getRef();
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
        pageParamRules.stream().filter(paramRule -> paramRule.getRef().contains("request.header.$"))
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
        pageParamRules.stream().filter(paramRule -> paramRule.getRef().split("\\.",2)[0].equals("response"))
                .forEach(paramRule -> {
                    String value = httpRepository.findValueByPath(paramRule.getRef());
                    if (paramRule.getParam().equals(PageParam.RESULT)) {
                        if (paramRule.getValue() == null || paramRule.getValue().isEmpty()) {
                            paramRule.setValue(response.getBody());
                            this.currentSize = JsonPath.parse(response.getBody()).read(paramRule.getRefPath() + ".length()");
                            return;
                        }
                        String path = paramRule.getRefPath();
                        String result = JsonPath.parse(paramRule.getValue()).set(path, paramRule.getValue()).json();
                        paramRule.setValue(result);
                        this.currentSize = this.currentSize + (Integer) JsonPath.parse(result).read(path + ".length()");
                        return;
                    }
                    if (paramRule.getParam().equals(PageParam.OFFSET)) {
                        if (paramRule.getAction().equals(PageParamAction.INCREMENT)) {
                            int offset = Integer.parseInt(findParam(PageParam.LIMIT).getValue());
                            value = Integer.parseInt(value) + offset + "";
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
                case "payload":
                    // TODO: Add xml support
                    ReadContext ctx = JsonPath.parse(payload);
                    return ctx.read(getRefPath(path));
                default:
                    throw new RuntimeException(location + " not found in path " + path + ". Should be one of [header, url, payload]");
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

        private static Map<String, String> splitQuery(String query) {
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
}
