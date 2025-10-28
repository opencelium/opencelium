package com.becon.opencelium.backend.api.module;

import com.becon.opencelium.backend.api.exception.RemoteApiException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

public class ReportModuleImpl implements ReportModule {

    private final RestTemplate rt;

    public ReportModuleImpl(RestTemplate rt) {
        this.rt = rt;
    }

    @Override
    public void sendReport(Object payload) {
        String endpoint = "/api/opencelium/history/save";
        try {
            rt.postForEntity(endpoint, payload, String.class);
        } catch (ResourceAccessException e) {
            throw new RemoteApiException("Service is not reachable at " + endpoint, e);
        }
    }

    @Override
    public ResponseEntity<String> getLastOperationUsageHistory() {
        String endpoint = "/api/opencelium/history/last";
        try {
            return rt.getForEntity(endpoint, String.class);
        } catch (ResourceAccessException e) {
            throw new RemoteApiException("Service is not reachable at " + endpoint, e);
        }

    }
}
