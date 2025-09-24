package com.becon.opencelium.backend.api;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class HttpRequestHelper {

    private final RestTemplate restTemplate;

    public HttpRequestHelper(String baseUrl) {
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
        this.restTemplate = restTemplateBuilder.rootUri(baseUrl).build();
    }

    public HttpRequestHelper(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
    }

    public <T> ResponseEntity<T> makeGetRequest(String endpoint, HttpHeaders headers, Class<T> responseType) {
        return makeRequest(endpoint, HttpMethod.GET, headers, null, responseType);
    }

    public <T> ResponseEntity<T> makePostRequest(String endpoint, HttpHeaders headers, Object body, Class<T> responseType) {
        return makeRequest(endpoint, HttpMethod.POST, headers, body, responseType);
    }

    private <T> ResponseEntity<T> makeRequest(String endpoint, HttpMethod method, HttpHeaders headers, Object body, Class<T> responseType ) {
        HttpEntity<?> entity = (body != null) ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers);
        return restTemplate.exchange(endpoint, method, entity, responseType);
    }
}
