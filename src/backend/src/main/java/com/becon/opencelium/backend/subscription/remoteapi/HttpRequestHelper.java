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

    public <T> ResponseEntity<T> makeGetRequest(String endpoint, HttpHeaders headers, Class<T> responseType) {
        return makeRequest(HttpMethod.GET, endpoint, headers, null, responseType);
    }

    public <T> ResponseEntity<T> makePostRequest(String endpoint, HttpHeaders headers, Object body, Class<T> responseType) {
        return makeRequest(HttpMethod.POST, endpoint, headers, body, responseType);
    }

    private <T> ResponseEntity<T> makeRequest(HttpMethod method, String endpoint, HttpHeaders headers, Object body, Class<T> responseType ) {
        String url = baseUrl + endpoint;
        HttpEntity<?> entity = (body != null) ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers);
        return restTemplate.exchange(url, method, entity, responseType);
    }
}
