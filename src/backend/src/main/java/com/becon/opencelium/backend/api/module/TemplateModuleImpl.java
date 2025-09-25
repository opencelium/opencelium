package com.becon.opencelium.backend.api.module;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

public class TemplateModuleImpl implements TemplateModule {

    private final RestTemplate rt;
    private final String BASE_URL;
    private static final Logger logger = LoggerFactory.getLogger(TemplateModuleImpl.class);

    public TemplateModuleImpl(RestTemplate rt) {
        this.rt = rt;
        this.BASE_URL = rt.getUriTemplateHandler().expand("").toString();
    }

    @Override
    public ResponseEntity<byte[]> getAllTemplateFiles() {
        String endpoint = "/api/opencelium/template/files";
        try {
            return rt.getForEntity(endpoint, byte[].class);
        } catch (ResourceAccessException e) {
            logger.error(BASE_URL + " is not reachable. Please check your settings!");
            throw new RuntimeException(BASE_URL + " is not reachable. Please check your settings!");
        } catch (HttpClientErrorException e) {
            logger.error(e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
}

