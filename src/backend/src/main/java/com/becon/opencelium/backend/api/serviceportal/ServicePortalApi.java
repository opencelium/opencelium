package com.becon.opencelium.backend.api.serviceportal;

import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.ApiType;
import com.becon.opencelium.backend.api.module.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Implementation of {@link ApiClient} for the Service Portal API.
 *
 * <p>Exposes Service Portal specific features (modules) such as
 * Invoker, Subscription, Report, and Template.
 */
@Service
public class ServicePortalApi implements ApiClient<ServicePortal> {

    private final RestTemplate restTemplate;
    private final String BASE_URL;
    private final ServicePortal features;

    /**
     * Constructs the Service Portal client and wires its modules.
     *
     * @param restTemplate the preconfigured RestTemplate bean
     *                     (with base URL and authentication headers)
     * This bean is defined in {@link com.becon.opencelium.backend.configuration.RemoteApiConfig},
     * where it is built with the Service Portal base URL
     * and an interceptor that adds the {@code x-access-token} header.
     */
    public ServicePortalApi(@Qualifier("servicePortalRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.BASE_URL = restTemplate.getUriTemplateHandler().expand("").toString();

        // initialize modules with the shared RestTemplate
        InvokerModule invoker   = new InvokerModuleImpl(restTemplate);
        SubscriptionModule sub  = new SubscriptionModuleImpl(restTemplate);
        ReportModule report     = new ReportModuleImpl(restTemplate);
        TemplateModule template = new TemplateModuleImpl(restTemplate);

        // expose modules via the ServicePortal interface
        this.features = new ServicePortal() {
            public InvokerModule invoker()           { return invoker; }
            public SubscriptionModule subscription() { return sub; }
            public ReportModule operationUsage()     { return report; }
            public TemplateModule template()         { return template; }
        };
    }

    /**
     * Connectivity check against Service Portal.
     * <p>Handles typical failures:
     * - unreachable service
     * - missing/invalid token
     * - forbidden access
     */
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

    /** Identifies this client as the Service Portal API. */
    @Override
    public ApiType<ServicePortal> type() {
        return ApiType.SERVICE_PORTAL;
    }

    /** Exposes the Service Portal feature set. */
    @Override
    public ServicePortal features() {
        return features;
    }
}
