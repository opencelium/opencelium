package com.becon.opencelium.backend.subscription.remoteapi;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

public class HttpRequestHelper {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public HttpRequestHelper(String baseUrl) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl;
    }

    public HttpRequestHelper(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public ResponseEntity<String> makeGetRequest(String endpoint, HttpHeaders headers) {
        return makeRequest(HttpMethod.GET, endpoint, headers, null);
    }

    public ResponseEntity<String> makePostRequest(String endpoint, HttpHeaders headers, Object body) {
        return makeRequest(HttpMethod.POST, endpoint, headers, body);
    }

    private ResponseEntity<String> makeRequest(HttpMethod method, String endpoint, HttpHeaders headers, Object body) {
        String url = baseUrl + endpoint;
        HttpEntity<?> entity = (body != null) ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers);
        return restTemplate.exchange(url, method, entity, String.class);
    }
}
