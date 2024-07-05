package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.enums.DataRef;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.IOException;
import java.io.StringReader;
import java.util.*;
import java.util.function.BiFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class BodyExtractor implements Extractor {

    private List<RequestData> requestData;
    private List<FunctionInvoker> functionInvokers;
    private boolean disableSll;

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
    public Extractor disableSslValidation(boolean disable) {
        this.disableSll = disable;
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
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder();
        for (String ref : extractRefs(expr)) {
            FunctionInvoker functionInvoker = getFunctionInvoker(ref);
            ResponseEntity<String> response = invokerRequestBuilder
                                        .setRequestData(requestData)
                                        .setSslCert(disableSll)
                                        .setFunction(functionInvoker).sendRequest();
            String path = getPathFromRef(expr);
            String value = getValueFromResponse(path, response);
            if (value == null) {
                value = "";
            }
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
            if (httpHeaders.get(pathParts.get(0)) == null) {
                return null;
            }
            return httpHeaders.get(pathParts.get(0)).get(0);
        }

        if(path.equals("body")){
            return Objects.requireNonNull(response.getBody()).replace("\"", "");// TODO replaced " to empty when body is just string
        }
        String body = response.getBody();
        MediaType contentType = response.getHeaders().getContentType();
        if (isJson(body)) {
            contentType = MediaType.APPLICATION_JSON;
        } else if (contentType == null) {
            throw new RuntimeException("Content-Type is not defined in header for response: " + response);
        }
        return readPayload(contentType.getSubtype()).apply(pathParts, body);
    }

    private BiFunction<List<String>, String, String> readPayload(String contentType) {
        if (contentType.contains("json")) {
            return (pathParts, json) -> {
                String jpath = "$." + pathParts.stream().map(Object::toString).collect(Collectors.joining("."));
                if (!pathExists(json, jpath)) {
                    throw new RuntimeException("Path " + jpath + " not found in " + json);
                }
                return JsonPath.read(json, jpath);
            };
        } else if (contentType.contains("xml")) {
            return  (pathParts, xml) -> {
                String xmlPath = "/" + pathParts.stream().map(Object::toString).collect(Collectors.joining("/"));
//                if (!pathExists(json, jpath)) {
//                    throw new RuntimeException("Path " + jpath + " not found in " + json);
//                }
                XPathFactory xpathfactory = XPathFactory.newInstance();
                XPath xpath = xpathfactory.newXPath();
                DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

                try {
                    DocumentBuilder builder = factory.newDocumentBuilder();
                    Document document = convertStringToXMLDocument(xml);
                    XPathExpression expr = xpath.compile(xmlPath); // //book[@year>2001]/title/text()
                    return expr.evaluate(document, XPathConstants.STRING).toString();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            };
        } else {
            throw new RuntimeException("Couldn't determine Content-Type: " + contentType);
        }
    }

    private boolean isJson(String payload) {
        ObjectMapper mapper = new ObjectMapper();
        try {
            mapper.readTree(payload);
        } catch (IOException e) {
            return false;
        }
        return true;
    }

    private static Document convertStringToXMLDocument(String xmlString)
    {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = null;
        try
        {
            builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return null;
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
