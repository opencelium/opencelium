package com.becon.opencelium.backend.api.module;

import com.becon.opencelium.backend.api.exception.RemoteApiException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.File;

public class SubscriptionModuleImpl implements SubscriptionModule {

    private final RestTemplate rt;

    public SubscriptionModuleImpl(RestTemplate rt) {
        this.rt = rt;
    }

    @Override
    public ResponseEntity<String> getAllSubs() {
        String endpoint = "/api/opencelium/license/all";
        try {
            return rt.getForEntity(endpoint, String.class);
        } catch (ResourceAccessException e) {
            throw new RemoteApiException("Service is not reachable at " + endpoint, e);
        }
    }

    @Override
    public ResponseEntity<String> getSubById(String id) {
        String endpoint = "/api/opencelium/license/" + id;
        try {
            return rt.getForEntity(endpoint, String.class);
        } catch (ResourceAccessException e) {
            throw new RemoteApiException("Service is not reachable at " + endpoint, e);
        }
    }

    @Override
    public ResponseEntity<String> generateLicenseKey(File activeRequest, String subId) {
        String endpoint = "/api/opencelium/license/generate/" + subId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(activeRequest));
        HttpEntity<?> entity = new HttpEntity<>(body, headers);

        try {
            return rt.exchange(endpoint, HttpMethod.POST, entity, String.class);
        } catch (ResourceAccessException e) {
            throw new RemoteApiException("Service is not reachable at " + endpoint, e);
        }
    }
}
