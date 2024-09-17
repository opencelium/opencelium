package com.becon.opencelium.backend.service_portal;

import org.springframework.http.*;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
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
        String url = baseURL + "opencelium/license/all";

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
        String url = baseURL + "opencelium/license/" + id;

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
    public ResponseEntity<String> generateLicense(MultipartFile file) {
        String url = baseURL + "license/generate";

        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.add(tokenName, token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource()); // No need for explicit Content-Disposition unless required

        MultiValueMap<String, HttpEntity<?>> multipartRequest =
                builder.build();

        // Create the request entity
        HttpEntity<MultiValueMap<String, HttpEntity<?>>> requestEntity = new HttpEntity<>(multipartRequest, headers);

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
