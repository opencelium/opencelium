/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// TODO: need to add interface for supporting multiple function conversion to response entity
// TODO: should be strategy pattern. Because a lot of strategies to authenticate
public class InvokerRequestBuilder{

    private RestTemplate restTemplate;
    private FunctionInvoker functionInvoker;
    private List<RequestData> requestData;

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

    public ResponseEntity<String> sendRequest(){
        HttpMethod method = getMethod();
        String url = buildUrl();
        HttpHeaders header = buildHeader();
        String body = buildBody();

        HttpEntity<String> httpEntity = new HttpEntity <String> (body, header);
        if (body.equals("null")){
            httpEntity = new HttpEntity <String> (header);
        }
        return restTemplate.exchange(url, method ,httpEntity, String.class);
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
                String value = requestData.stream()
                        .filter(r -> r.getField().equals(requiredField))
                        .map(RequestData::getValue).findFirst().get();

                headerItem.put(k, value);
                return;
            }
            headerItem.put(k, v);
        });
        httpHeaders.setAll(headerItem);
        return httpHeaders;
    }

    private String buildBody() {
        try {
            Map<String,Object> body = functionInvoker.getRequest().getBody();
            ObjectMapper objectMapper = new ObjectMapper();
            String json = objectMapper.writeValueAsString(body);
            for (RequestData data : requestData) {
                String field = "{" + data.getField() + "}";
                if (!json.contains(field)){
                    continue;
                }
                json = json.replace(field, data.getValue());
            }
            return json;
        } catch (JsonProcessingException e){
            throw new RuntimeException(e);
        }
    }
}
