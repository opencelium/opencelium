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

import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.utility.XmlTransformer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.DefaultHostnameVerifier;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustStrategy;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// TODO: need to add interface for supporting multiple function conversion to response entity
public class InvokerRequestBuilder{

    private RestTemplate restTemplate;
    private FunctionInvoker functionInvoker;
    private List<RequestData> requestData;
    private String invokerName;

    public InvokerRequestBuilder(RestTemplate restTemplate){
        this.restTemplate = restTemplate;
    }

    public InvokerRequestBuilder setRequestData(List<RequestData> requestData){
        this.requestData = requestData;
        return this;
    }

    public InvokerRequestBuilder setFunction(FunctionInvoker function){
        this.functionInvoker = function;
        return this;
    }

    public InvokerRequestBuilder setInvokerName(String invokerName) {
        this.invokerName = invokerName;
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

        if (invokerName.equals("igel")){
            restTemplate = getRestTemplate();
        }
        return restTemplate.exchange(url, method ,httpEntity, String.class);
    }

    private RestTemplate getRestTemplate() {

        try {
            TrustStrategy acceptingTrustStrategy = (X509Certificate[] chain, String authType) -> true;
            SSLContext sslContext = org.apache.http.ssl.SSLContexts.custom()
                    .loadTrustMaterial(null, acceptingTrustStrategy)
                    .build();
            SSLConnectionSocketFactory csf = new SSLConnectionSocketFactory(sslContext);
            CloseableHttpClient httpClient = HttpClients.custom()
                    .setSSLSocketFactory(csf)
                    .build();
            HttpComponentsClientHttpRequestFactory requestFactory =
                    new HttpComponentsClientHttpRequestFactory();
            requestFactory.setHttpClient(httpClient);
            RestTemplate restTemplate = new RestTemplate(requestFactory);
            return restTemplate;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

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
                XmlTransformer transformer = new XmlTransformer(document);
                result = transformer.xmlToString(body.getFields());
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
}
