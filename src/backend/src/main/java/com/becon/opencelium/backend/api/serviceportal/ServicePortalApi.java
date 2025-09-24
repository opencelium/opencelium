package com.becon.opencelium.backend.api.serviceportal;

import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.ApiType;
import com.becon.opencelium.backend.api.HttpRequestHelper;
import com.becon.opencelium.backend.api.module.*;
import com.becon.opencelium.backend.configuration.ApplicationContextProvider;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.api.enums.ApiModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.File;

@Service
public class ServicePortalApi implements ApiClient<ServicePortal> {

    private final RestTemplate restTemplate;
    private final String BASE_URL;
    private final ServicePortal features;

    public ServicePortalApi(@Qualifier("servicePortalRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.BASE_URL = restTemplate.getUriTemplateHandler().expand("").toString();

        InvokerModule invoker   = new InvokerModuleImpl(restTemplate);
        SubscriptionModule sub  = new SubscriptionModuleImpl(restTemplate);
        ReportModule report     = new ReportModuleImpl(restTemplate);
        TemplateModule template = new TemplateModuleImpl(restTemplate);

        this.features = new ServicePortal() {
            public InvokerModule invoker()           { return invoker; }
            public SubscriptionModule subscription() { return sub; }
            public ReportModule operationUsage()     { return report; }
            public TemplateModule template()         { return template; }
        };
    }

    @Override
    public ResponseEntity<String> checkConnection() {
        String endpoint = "/api/opencelium/connection/status";
        try {
            return restTemplate.getForEntity(endpoint, String.class);
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
            throw e;
        }
        return null;
    }

    @Override
    public ApiType<ServicePortal> type() {
        return ApiType.SERVICE_PORTAL;
    }

    @Override
    public ServicePortal features() {
        return features;
    }
}
