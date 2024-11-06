package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.ReportModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.io.File;
import java.util.Objects;

public class ServicePortal implements RemoteApi, SubscriptionModule, ReportModule {

    private final String BASE_URL;
    private final String AUTH_TOKEN;
    private final HttpRequestHelper httpRequestHelper;

    public ServicePortal() {
        YamlPropertiesFactoryBean yamlPropertiesFactoryBean = new YamlPropertiesFactoryBean();
        yamlPropertiesFactoryBean.setResources(new ClassPathResource("application.yml"));
        BASE_URL = Objects.requireNonNull(yamlPropertiesFactoryBean.getObject()).getProperty(AppYamlPath.SP_BASE_URL);
        AUTH_TOKEN = Objects.requireNonNull(yamlPropertiesFactoryBean.getObject()).getProperty(AppYamlPath.SP_TOKEN);
        this.httpRequestHelper = new HttpRequestHelper(BASE_URL);
    }

    @Override
    public ResponseEntity<String> checkConnection() {
        String endpoint = "/api/opencelium/connection/status";
        try {
            return  httpRequestHelper.makeGetRequest(endpoint, createHeaders());
        } catch (ResourceAccessException e) {
            // This handles cases when the URL is not reachable
            e.printStackTrace();
            throw new RuntimeException("Service Portal " + BASE_URL + endpoint + " is not reachable. Please check your settings!");
        } catch (HttpClientErrorException.Unauthorized e) {
            // This handles cases when the token is either missing or invalid
            e.printStackTrace();
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new RuntimeException("Token for Service Portal Auth is not valid. Please check your settings!");
            }
        } catch (HttpClientErrorException.Forbidden e) {
            // This handles cases when the token is missing
            e.printStackTrace();
            throw new RuntimeException("Token for Service Portal Auth is not set. Please check your settings!");
        } catch (Exception e) {
            // This catches any other unexpected errors
            e.printStackTrace();
            throw new RuntimeException("An unexpected error occurred: " + e.getMessage());
        }
        return null;
    }

    @Override
    public <T> T getModule(ApiModule module) throws IllegalArgumentException {
        if (module.getModuleClass().isAssignableFrom(SubscriptionModule.class)) {
            return (T) this;
        } else {
            throw new IllegalArgumentException("Interface " + module.getModuleClass() + " not implemented by RemoteApi");
        }
    }

//    @Override
//    public ResponseEntity<String> getAllSubs() {
//        String url = BASE_URL + "/api/opencelium/license/all";
//        HttpHeaders headers = getHeader();
//        HttpEntity<String> entity = new HttpEntity<>(headers);
//        return restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
//    }
//
//    @Override
//    public ResponseEntity<String> getSubById(String id) {
//        String url = BASE_URL + "/api/opencelium/license/" + id;
//        HttpHeaders headers = getHeader();
//        HttpEntity<String> entity = new HttpEntity<>(headers);
//        return restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
//    }
//
//    @Override
//    public ResponseEntity<String> generateLicenseKey(File activeRequest, String subId) {
//        String url = BASE_URL + "/api/opencelium/license/generate/" + subId;
//        HttpHeaders headers = getHeader();
//        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
//
//        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
//        body.add("file", new FileSystemResource(activeRequest));
//
//        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
//        return restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
//    }

    @Override
    public ResponseEntity<String> getAllSubs() {
        return httpRequestHelper.makeGetRequest("/api/opencelium/license/all", createHeaders());
    }

    @Override
    public ResponseEntity<String> getSubById(String id) {
        return httpRequestHelper.makeGetRequest("/api/opencelium/license/" + id, createHeaders());
    }

    @Override
    public ResponseEntity<String> generateLicenseKey(File activeRequest, String subId) {
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(activeRequest));

        return httpRequestHelper.makePostRequest("/api/opencelium/license/generate/" + subId, headers, body);
    }

    @Override
    public void sendReport(String payload) {
        httpRequestHelper.makePostRequest("/api/opencelium/history/save", createHeaders(), payload);
    }

    @Override
    public ResponseEntity<String> getLastOperationUsageHistory() {
        return httpRequestHelper.makeGetRequest("/api/opencelium/history/last", createHeaders());
    }

    // ------------------------------------ PRIVATE ---------------------------------------------------------

    private HttpHeaders createHeaders() {
        if (AUTH_TOKEN == null || AUTH_TOKEN.isEmpty()) {
            throw new RuntimeException("Token for the Service Portal Auth is not set. " +
                    "Please check your settings in application.yml file. Path: " + AppYamlPath.SP_TOKEN);
        }
        if (BASE_URL == null || BASE_URL.isEmpty()) {
            throw new RuntimeException("Base URL for the Service Portal is not set. " +
                    "Please check your settings in application.yml file. Path: " + AppYamlPath.SP_BASE_URL);
        }
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.set("x-access-token", AUTH_TOKEN);
        return httpHeaders;
    }
}
