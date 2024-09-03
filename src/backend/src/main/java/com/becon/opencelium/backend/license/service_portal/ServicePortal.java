package com.becon.opencelium.backend.license.service_portal;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class ServicePortal
        extends RemoteApi
        implements LicenseModule {

    private static final Lock lock = new ReentrantLock();
    private static final String tokenName = "x-access-token";
    private static ServicePortal instance;

    private final String baseURL;
    private final String token;
    private final RestTemplate restTemplate;

    private ServicePortal() {
        restTemplate = new RestTemplate();
        Map<String, String> props = getConfigs();
        String baseUrl = props.get("base_url");
        baseURL = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        token = props.get("token");
    }

    @Override
    public ResponseEntity<String> getAllSubs() {
        String url = baseURL + "subscription/all";

        // Set up the headers with the token
        HttpHeaders headers = new HttpHeaders();
        headers.add(tokenName, token);

        // Create the request entity
        HttpEntity<String> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
        } catch (RestClientException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @Override
    public ResponseEntity<String> getSubById(String id) {
        String url = baseURL + "subscription/" + id;

        // Set up the headers with the token
        HttpHeaders headers = new HttpHeaders();
        headers.add(tokenName, token);

        // Create the request entity
        HttpEntity<String> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
        } catch (RestClientException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @Override
    public ResponseEntity<String> generateLicense(String subId, ByteArrayResource file) {
        String url = baseURL + "license/generate/" + subId;

        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.add(tokenName, token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", file);

        // Create the HttpEntity
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );
        } catch (RestClientException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @Override
    public ResponseEntity<String> checkConnection() {
        String url = baseURL + "connection/status";

        // Set up the headers with the token
        HttpHeaders headers = new HttpHeaders();
        headers.add(tokenName, token);

        // Create the request entity
        HttpEntity<String> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
        } catch (RestClientException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @Override
    public Module getModule() {
        return this;
    }

    public static ServicePortal getInstance() {
        try {
            lock.lock();
            if (instance == null) {
                instance = new ServicePortal();
            }
        } finally {
            lock.unlock();
        }
        return instance;
    }

    private Map<String, String> getConfigs() {
        Map<String, String> props = new HashMap<>();
        Yaml yaml = new Yaml();
        try {
            InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream("application.yml");
            Map<String, Object> obj = yaml.load(inputStream);
            Map<String, Object> opencelium = (Map<String, Object>) obj.getOrDefault("opencelium", new HashMap<>());
            Map<String, Object> servicePortal = (Map<String, Object>) opencelium.getOrDefault("service_portal", new HashMap<>());
            props.put("base_url", (String) servicePortal.getOrDefault("base_url", ""));
            props.put("token", (String) servicePortal.getOrDefault("token", ""));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return props;
    }
}
