package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.constant.DataRef;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class BodyExtractor implements Extractor{

    private List<RequestData> requestData;
    private List<FunctionInvoker> functionInvokers;

    @Override
    public Extractor setRequestData(List<RequestData> requestData) {
        this.requestData = requestData;
        return this;
    }

    @Override
    public Extractor setFunctions(List<FunctionInvoker> functionInvokerList) {
        this.functionInvokers = functionInvokerList;
        return this;
    }

    @Override
    public Optional<String> getValue(String fieldName) {
        String expr = requestData.stream()
                .filter(rq -> rq.getField().equals(fieldName))
                .map(RequestData::getValue).findFirst().orElse(null);
        if (expr == null) {
            return Optional.empty();
        }
        RestTemplate restTemplate = new RestTemplate();
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder(restTemplate);
        String val;
        for (String ref : extractRefs(expr)) {
            FunctionInvoker functionInvoker = getFunctionInvoker(ref);
            ResponseEntity<String> response = invokerRequestBuilder
                                        .setRequestData(requestData)
                                        .setFunction(functionInvoker).sendRequest();
            String path = getPathFromRef(expr);
            String value = getValueFromResponse(path, response);
            expr = expr.replace(ref, value);
        }
        return Optional.of(expr);
    }

    // bodyRef : %{methodName.body/header.f1.f2.f3}
    private FunctionInvoker getFunctionInvoker(String bodyRef) {
        String functionName = bodyRef.split("\\.")[0].replace("%{", "");
        if (functionName.equals("body") || functionName.equals("header")) {
            return functionInvokers.stream().filter(f -> f.getName().equals("test")).findFirst().get();
        }
        return functionInvokers.stream()
                .filter(f -> f.getName().equals(functionName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Function from \"" + bodyRef + "\" not found in invoker operations"));
    }

    // excepts %{methodName.body/header.f1.f2.f3}
    // returns body/header.f1.f2.f3.f4
    // f1, f2, f3 ... fn - fields
    private String getPathFromRef(String bodyRef) {
        StringBuilder sb = new StringBuilder(bodyRef);
        sb.delete(0, 2); // removing %{
        sb.deleteCharAt(sb.length() - 1); // removing }
        String methodName = sb.toString().split("\\.")[0]; // required for removing from ref;
        sb.delete(sb.indexOf(methodName), methodName.length() + 1); // removing name of method
        return sb.toString();
    }

    // excepts: body/header.f1.f2.f3.f4
    private String getValueFromResponse(String path, ResponseEntity<String> response) {
        List<String> pathParts = new ArrayList<>(Arrays.asList(path.split("\\.")));
        boolean isHeader = pathParts.get(0).contains("header");
        pathParts.remove(0); // remove header or body identifier

        if (isHeader) {
            HttpHeaders httpHeaders = response.getHeaders();
            return Objects.requireNonNull(httpHeaders.get(pathParts.get(0))).get(0);
        }

        if(path.equals("body")){
            return Objects.requireNonNull(response.getBody()).replace("\"", "");// TODO replaced " to empty when body is just string
        }
        String jpath = "$." + pathParts.stream().map(Object::toString).collect(Collectors.joining("."));
        String body = response.getBody();

        if (!pathExists(body, jpath)) {
            throw new RuntimeException("Path " + jpath + " not found in " + body);
        }
        return JsonPath.read(body, jpath);
    }

    // collects refs: %{exp1}
    private List<String> extractRefs(String expr) {
        List<String> refs = new ArrayList<>();
        Pattern pattern = Pattern.compile(DataRef.BODY.toString());
        Matcher matcher = pattern.matcher(expr);

        while (matcher.find()) {
            refs.add(matcher.group());
        }
        return refs;
    }

//    private boolean pathExists(String json, List<String> pathParts) {
//        StringBuilder currentPath = new StringBuilder("$");
//        try {
//            pathParts.forEach(p -> {
//                currentPath.append(".").append(p);
//                JsonPath.read(json, currentPath.toString());
//            });
//            return true;
//        } catch (Exception e) {
//            return false;
//        }
//    }

    private boolean pathExists(String json, String jpath) {
        try {
            JsonPath.read(json, jpath);
            return true;
        } catch (Exception e) {
            return false;
        }
//        return pathExists(json, Arrays.asList(jpath.split("\\.")));
    }
}
