package com.becon.opencelium.backend.rbmq_execution.http;

import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class RestClient<T> implements WebServiceClient<T> {

    private RestTemplate restTemplate = new RestTemplate();

    @Override
    public ResponseEntity<T> send(OcRequest request, Class<T> responseType) {
        HttpEntity<String> httpEntity = new HttpEntity<>(request.getBody(), request.getHttpHeaders());
        return restTemplate.exchange(request.getUri(), request.getHttpMethod(), httpEntity, responseType);
    }
}
