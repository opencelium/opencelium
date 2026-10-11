package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.configuration.OidcProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Builds the client registration of the identity provider on demand.
 *
 * Spring's own discovery (ClientRegistrations.fromIssuerLocation) runs while the beans are created and
 * offers no way to set a timeout, which made a restart of OpenCelium depend on the identity provider
 * being reachable - and with it the schedules and webhooks, because the whole application failed to
 * start. Discovery therefore happens on the first /oidc/authorize, through a client that carries the
 * configured timeout, and {@link LazyClientRegistrationRepository} caches the result.
 */
public class OidcClientRegistrationFactory {

    private static final String DISCOVERY_PATH = "/.well-known/openid-configuration";

    private final OidcProperties properties;
    private final RestOperations restOperations;

    public OidcClientRegistrationFactory(OidcProperties properties) {
        this.properties = properties;
        this.restOperations = restTemplateWithTimeout(properties.getTimeout());
    }

    /** An unresponsive identity provider must not keep a login request waiting longer than configured. */
    public static RestTemplate restTemplateWithTimeout(int timeoutMillis) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMillis);
        requestFactory.setReadTimeout(timeoutMillis);

        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(requestFactory);

        return restTemplate;
    }

    /** Uses discovery when an issuer is configured, otherwise the endpoints from the configuration. */
    public ClientRegistration create() {
        return StringUtils.hasText(properties.getIssuerUri())
                ? fromDiscovery(properties.getIssuerUri())
                : fromConfiguredEndpoints();
    }

    private ClientRegistration fromDiscovery(String issuerUri) {
        Map<String, Object> metadata = discoveryDocument(issuerUri);

        // The document has to belong to the issuer that was asked for, otherwise the endpoints it
        // names are not the ones this client is registered at.
        String reportedIssuer = text(metadata, "issuer");
        if (!withoutTrailingSlash(issuerUri).equals(withoutTrailingSlash(reportedIssuer))) {
            throw new IllegalStateException("The discovery document of '" + issuerUri + "' reports issuer '"
                    + reportedIssuer + "'");
        }

        ClientRegistration.Builder builder = builder()
                .authorizationUri(required(metadata, "authorization_endpoint", issuerUri))
                .tokenUri(required(metadata, "token_endpoint", issuerUri))
                .jwkSetUri(required(metadata, "jwks_uri", issuerUri))
                .issuerUri(issuerUri)
                .providerConfigurationMetadata(metadata);

        // Optional: without it the login simply sends no UserInfo request.
        String userInfoUri = text(metadata, "userinfo_endpoint");
        if (userInfoUri != null) {
            builder.userInfoUri(userInfoUri);
        }

        return builder.build();
    }

    private ClientRegistration fromConfiguredEndpoints() {
        return builder()
                .authorizationUri(properties.getAuthorizationUri())
                .tokenUri(properties.getTokenUri())
                .jwkSetUri(properties.getJwkSetUri())
                .build();
    }

    private ClientRegistration.Builder builder() {
        return ClientRegistration.withRegistrationId(OidcProperties.REGISTRATION_ID)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .clientId(properties.getClientId())
                .clientSecret(properties.getClientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .redirectUri(properties.getRedirectUri())
                .scope(properties.getScopes().toArray(String[]::new))
                .clientName(properties.getDisplayName());
    }

    private Map<String, Object> discoveryDocument(String issuerUri) {
        String url = withoutTrailingSlash(issuerUri) + DISCOVERY_PATH;

        try {
            ResponseEntity<Map<String, Object>> response = restOperations.exchange(url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {
                    });

            Map<String, Object> metadata = response.getBody();
            if (metadata == null) {
                throw new IllegalStateException("The discovery document of '" + issuerUri + "' is empty");
            }

            return metadata;
        } catch (RestClientException e) {
            throw new IllegalStateException("The discovery document of '" + issuerUri + "' could not be read: "
                    + e.getMessage(), e);
        }
    }

    private String required(Map<String, Object> metadata, String key, String issuerUri) {
        String value = text(metadata, key);
        if (value == null) {
            throw new IllegalStateException("The discovery document of '" + issuerUri + "' has no '" + key + "'");
        }

        return value;
    }

    private String text(Map<String, Object> metadata, String key) {
        Object value = metadata.get(key);

        return value == null || !StringUtils.hasText(value.toString()) ? null : value.toString();
    }

    private String withoutTrailingSlash(String value) {
        return value == null ? null : value.replaceAll("/+$", "");
    }
}
