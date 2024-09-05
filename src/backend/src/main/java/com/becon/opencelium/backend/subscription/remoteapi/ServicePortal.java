package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.subscription.remoteapi.dto.ConnectionStatusDto;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;

@Component
public class ServicePortal implements RemoteApi, SubscriptionModule {

    private String BASE_URL = "http://oc-service-portal.westeurope.cloudapp.azure.com:443";
    private String AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YzQ1ZjBiYTk3MTFmODcwOWE3OTMzNSIsImVtYWlsIjoic3ViXzJAbWFpbC5jb20iLCJjb21wYW55SWQiOiI2NmM0NWVjZGE5NzExZjg3MDlhNzkyNzMiLCJpYXQiOjE3MjQxNDU1MDMsImV4cCI6MTczNDE0NTUwM30.dcKKz05Tyyyqe10jJN5G6mrwaMcdxMuz-fGFdr_MNe0";
    private final RestTemplate restTemplate;
    public ServicePortal() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ResponseEntity<String> checkConnection() {
        String url = BASE_URL + "/api/opencelium/connection/status";
        try {
            HttpHeaders httpHeaders = getHeader();
            HttpEntity<String> httpEntity = new HttpEntity<>(httpHeaders);
            return restTemplate.exchange(url, HttpMethod.GET, httpEntity, String.class);
        } catch (Exception e) {
            // Log the error or handle it accordingly
            throw new RuntimeException(e);
        }
    }

    @Override
    public <T> T getModule(ApiModule module) throws IllegalArgumentException {
        if (module.getModuleClass().isAssignableFrom(SubscriptionModule.class)) {
            return (T) this;
        } else {
            throw new IllegalArgumentException("Interface " + module.getModuleClass() + " not implemented by RemoteApi");
        }
    }

    @Override
    public ResponseEntity<String> getAllSubs() {
        String url = BASE_URL + "/api/opencelium/subscription/all";
        HttpHeaders headers = getHeader();
        HttpEntity<String> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
    }

    @Override
    public ResponseEntity<String> getSubById(String id) {
        String url = BASE_URL + "/api/opencelium/subscription/" + id;
        HttpHeaders headers = getHeader();
        HttpEntity<String> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
    }

    @Override
    public ResponseEntity<String> generateLicenseKey(File activeRequest, String subId) {
        String url = BASE_URL + "/api/opencelium/license/generate/" + subId;
        HttpHeaders headers = getHeader();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(activeRequest));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
    }

    private HttpHeaders getHeader() {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.set("x-access-token", AUTH_TOKEN);
        return httpHeaders;
    }
}
