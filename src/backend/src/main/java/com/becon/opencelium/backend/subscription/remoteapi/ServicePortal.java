package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.subscription.remoteapi.dto.ConnectionStatusDto;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.Objects;

public class ServicePortal implements RemoteApi, SubscriptionModule {

    private final String BASE_URL;
    private final String AUTH_TOKEN;
    private final RestTemplate restTemplate;

    public ServicePortal() {
        this.restTemplate = new RestTemplate();
        YamlPropertiesFactoryBean yamlPropertiesFactoryBean = new YamlPropertiesFactoryBean();
        yamlPropertiesFactoryBean.setResources(new ClassPathResource("application.yml"));
        BASE_URL = Objects.requireNonNull(yamlPropertiesFactoryBean.getObject()).getProperty(AppYamlPath.SP_BASE_URL);
        AUTH_TOKEN = Objects.requireNonNull(yamlPropertiesFactoryBean.getObject()).getProperty(AppYamlPath.SP_TOKEN);
    }

    @Override
    public ResponseEntity<String> checkConnection() {
        String url = BASE_URL + "/api/opencelium/connection/status";
        try {
            HttpHeaders httpHeaders = getHeader();
            HttpEntity<String> httpEntity = new HttpEntity<>(httpHeaders);
            return restTemplate.exchange(url, HttpMethod.GET, httpEntity, String.class);
        } catch (ResourceAccessException e) {
            // This handles cases when the URL is not reachable
            e.printStackTrace();
            throw new RuntimeException("Service Portal " + url + " is not reachable. Please check your settings!");
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

    @Override
    public ResponseEntity<String> getAllSubs() {
        String url = BASE_URL + "/api/opencelium/license/all";
        HttpHeaders headers = getHeader();
        HttpEntity<String> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
    }

    @Override
    public ResponseEntity<String> getSubById(String id) {
        String url = BASE_URL + "/api/opencelium/license/" + id;
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
