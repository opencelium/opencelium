/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.invoker;

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.net.InetSocketAddress;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// TODO: need to add interface for supporting multiple function conversion to response entity
public class InvokerRequestBuilder {

    private FunctionInvoker functionInvoker;
    private List<RequestData> requestData;
    private boolean sslCert;
    private String proxyPort;
    private String proxyHost;

    public InvokerRequestBuilder() {
    }

    public InvokerRequestBuilder setRequestData(List<RequestData> requestData){
        this.requestData = requestData;
        return this;
    }

    public InvokerRequestBuilder setFunction(FunctionInvoker function){
        this.functionInvoker = function;
        return this;
    }

    public InvokerRequestBuilder setSslCert(boolean sslCert) {
        this.sslCert = sslCert;
        return this;
    }

    public InvokerRequestBuilder setProxyPort(String proxyPort) {
        this.proxyPort = proxyPort;
        return this;
    }

    public InvokerRequestBuilder setProxyHost(String proxyHost) {
        this.proxyHost = proxyHost;
        return this;
    }

    public ResponseEntity<String> sendRequest(){
        HttpMethod method = getMethod();
        String url = buildUrl();
        HttpHeaders header = buildHeader();
        String body = buildBody();

        Object data;
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();

        String contentType = "";
        if (header.containsKey("Content-Type")){
            contentType = header.get("Content-Type").get(0);
        }

        if (header.containsKey("Content-Type") && contentType.equals("application/x-www-form-urlencoded")){
            try {
                HashMap<String, Object> mapData = new ObjectMapper().readValue(body, HashMap.class);
                mapData.forEach(formData::add);
                data = formData;
            } catch (Exception e){
                throw new RuntimeException(e);
            }
        } else {
            data = body;
        }

        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
        if (body == null || body.equals("null")){
            httpEntity = new HttpEntity <Object> (header);
        }
        RestTemplate restTemplate = createRestTemplate();
        ResponseEntity response;
        if (header.getContentType().toString().contains("json")) {
            ResponseEntity o = restTemplate.exchange(url, method ,httpEntity, Object.class);
            response = InvokerRequestBuilder
                    .convertToStringResponse(o);
        } else {
            response = restTemplate.exchange(url, method ,httpEntity, String.class);
        }
        return response;
    }

    private RestTemplate createRestTemplate() {
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxyHost, proxyPort, sslCert));
        return restTemplateBuilder.build();
    }

    private HttpMethod getMethod(){
        HttpMethod httpMethodType;
        switch (functionInvoker.getRequest().getMethod()){
            case "POST":
                httpMethodType = HttpMethod.POST;
                break;
            case "DELETE":
                httpMethodType = HttpMethod.DELETE;
                break;
            case "PUT":
                httpMethodType = HttpMethod.PUT;
                break;
            case "GET":
                httpMethodType = HttpMethod.GET;
                break;
            default:
                throw new RuntimeException("Http method not found");
        }
        return httpMethodType;
    }

    private String buildUrl(){
        String endpoint = functionInvoker.getRequest().getEndpoint();

        for (RequestData data : requestData) {
            String field = "{" + data.getField() + "}";// TODO: should be regular expression
            if (endpoint.contains(field)){
                endpoint = endpoint.replace(field,data.getValue());
            }
        }
        return endpoint;
    }

    private HttpHeaders buildHeader(){
        HttpHeaders httpHeaders = new HttpHeaders();
        final Map<String, String> header = functionInvoker.getRequest().getHeader();
        Map<String, String> headerItem = new HashMap<>();

        header.forEach((k,v) -> {
            String requiredField;
            if (v.contains("{") && v.contains("}")){
                requiredField = v.replace("{","").replace("}","");
//                String value = requestData.stream()
//                        .filter(r -> r.getField().equals(requiredField))
//                        .map(RequestData::getValue).findFirst().get();
                String curlyValue = v;
                for (RequestData data : requestData) {
                    String field = "{" + data.getField() + "}";// TODO: should be regular expression
                    if (v.contains(field)){
                        curlyValue = curlyValue.replace(field,data.getValue());
                    }
                }
                headerItem.put(k, curlyValue);
                return;
            }
            headerItem.put(k, v);
        });
        httpHeaders.setAll(headerItem);
        return httpHeaders;
    }

    private String buildBody() {
        try {
            Body body = functionInvoker.getRequest().getBody();
            if (body == null) {
                return null;
            }
            ObjectMapper objectMapper = new ObjectMapper();
            String result = "";
            if (body.getFormat().equals("xml")) {
                Document document = createDocument();
                Xml transformer = new Xml(document);
                result = transformer.toString(body.getFields());
            } else {
                result = objectMapper.writeValueAsString(body.getFields());
            }

            for (RequestData data : requestData) {
                String field = "{" + data.getField() + "}";
                if (!result.contains(field)){
                    continue;
                }
                result = result.replace(field, data.getValue());
            }
            return result;
        } catch (JsonProcessingException e){
            throw new RuntimeException(e);
        }
    }

    private Document createDocument() {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        try {
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.newDocument();
        }catch (ParserConfigurationException parserException) {
            parserException.printStackTrace();
            throw new RuntimeException(parserException);
        }
    }

    // Need for PrettyPrinter during logging
    public static ResponseEntity<String> convertToStringResponse(ResponseEntity response) {
        ObjectWriter ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
        String json = "";
        try {
            json = ow.writeValueAsString(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return new ResponseEntity<>(json, response.getHeaders(), response.getStatusCode());
    }
}
