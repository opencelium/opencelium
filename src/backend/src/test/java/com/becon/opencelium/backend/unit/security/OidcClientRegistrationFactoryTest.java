/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.security.oidc.LazyClientRegistrationRepository;
import com.becon.opencelium.backend.security.oidc.OidcClientRegistrationFactory;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Run with: ./gradlew test --tests "*.OidcClientRegistrationFactoryTest"
 *
 * Discovery must not run while the application starts, because a restart of OpenCelium would then
 * depend on the identity provider being up. The first /oidc/authorize pays for it, the result is
 * cached, and a failure is retried on the next login instead of being remembered.
 */
@DisplayName("OidcClientRegistrationFactory — discovery on demand")
class OidcClientRegistrationFactoryTest {

    private static final AtomicInteger discoveryRequests = new AtomicInteger();

    private static HttpServer identityProvider;
    private static String issuer;
    private static volatile boolean reportsAnotherIssuer;
    private static volatile boolean hangs;

    @BeforeAll
    static void startIdentityProvider() throws IOException {
        identityProvider = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        // A hanging request must not keep the other tests waiting for their turn.
        identityProvider.setExecutor(Executors.newCachedThreadPool());
        issuer = "http://localhost:" + identityProvider.getAddress().getPort();

        identityProvider.createContext("/.well-known/openid-configuration", exchange -> {
            discoveryRequests.incrementAndGet();
            if (hangs) {
                sleep(5000);
            }
            String reported = reportsAnotherIssuer ? "http://somewhere.else" : issuer;

            respondJson(exchange, """
                    {
                      "issuer": "%s",
                      "authorization_endpoint": "%s/authorize",
                      "token_endpoint": "%s/token",
                      "jwks_uri": "%s/jwks",
                      "userinfo_endpoint": "%s/userinfo"
                    }
                    """.formatted(reported, issuer, issuer, issuer, issuer));
        });
        identityProvider.start();
    }

    @AfterAll
    static void stopIdentityProvider() {
        identityProvider.stop(0);
    }

    @BeforeEach
    void setUp() {
        discoveryRequests.set(0);
        reportsAnotherIssuer = false;
        hangs = false;
    }

    @Test
    void nothingIsFetchedWhileTheApplicationStarts() {
        ClientRegistrationRepository repository = repository(discoveryProperties());

        assertThat(repository).isNotNull();
        assertThat(discoveryRequests.get()).isZero();
    }

    @Test
    void theFirstLookupBuildsTheRegistrationFromTheDiscoveryDocument() {
        ClientRegistration registration = repository(discoveryProperties()).findByRegistrationId("opencelium");

        assertThat(registration.getProviderDetails().getAuthorizationUri()).isEqualTo(issuer + "/authorize");
        assertThat(registration.getProviderDetails().getTokenUri()).isEqualTo(issuer + "/token");
        assertThat(registration.getProviderDetails().getJwkSetUri()).isEqualTo(issuer + "/jwks");
        assertThat(registration.getProviderDetails().getUserInfoEndpoint().getUri()).isEqualTo(issuer + "/userinfo");
        assertThat(registration.getProviderDetails().getIssuerUri()).isEqualTo(issuer);
        assertThat(registration.getClientId()).isEqualTo("opencelium");
        assertThat(registration.getRedirectUri()).isEqualTo("http://localhost:9090/oidc/callback");
        assertThat(discoveryRequests.get()).isEqualTo(1);
    }

    @Test
    void discoveryRunsOnceAndTheResultIsCached() {
        ClientRegistrationRepository repository = repository(discoveryProperties());

        repository.findByRegistrationId("opencelium");
        repository.findByRegistrationId("opencelium");

        assertThat(discoveryRequests.get()).isEqualTo(1);
        // An unknown registration id is not the configured one, so it must not trigger anything.
        assertThat(repository.findByRegistrationId("another-provider")).isNull();
        assertThat(discoveryRequests.get()).isEqualTo(1);
    }

    @Test
    void aFailedDiscoveryIsNotCachedSoThatTheNextLoginTriesAgain() {
        ClientRegistrationRepository repository = repository(discoveryProperties());
        reportsAnotherIssuer = true;

        assertThatThrownBy(() -> repository.findByRegistrationId("opencelium"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("reports issuer");

        reportsAnotherIssuer = false;

        assertThat(repository.findByRegistrationId("opencelium")).isNotNull();
        assertThat(discoveryRequests.get()).isEqualTo(2);
    }

    @Test
    void configuredEndpointsNeedNoDiscoveryAtAll() {
        ClientRegistration registration = repository(configuredProperties()).findByRegistrationId("opencelium");

        assertThat(registration.getProviderDetails().getAuthorizationUri())
                .isEqualTo("https://idp.example.com/authorize");
        assertThat(registration.getProviderDetails().getTokenUri()).isEqualTo("https://idp.example.com/token");
        assertThat(discoveryRequests.get()).isZero();
    }

    @Test
    void aDiscoveryThatHangsIsGivenUpAfterTheConfiguredTimeout() {
        OidcProperties properties = discoveryProperties();
        properties.setTimeout(300);
        ClientRegistrationRepository repository = repository(properties);
        hangs = true;

        long startedAt = System.currentTimeMillis();

        assertThatThrownBy(() -> repository.findByRegistrationId("opencelium"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("could not be read");

        long elapsed = System.currentTimeMillis() - startedAt;
        hangs = false;

        // The server sleeps for five seconds, the configured timeout is 300ms.
        assertThat(elapsed).isLessThan(3000);
    }

    private ClientRegistrationRepository repository(OidcProperties properties) {
        return new LazyClientRegistrationRepository(OidcProperties.REGISTRATION_ID,
                new OidcClientRegistrationFactory(properties)::create);
    }

    private OidcProperties discoveryProperties() {
        OidcProperties properties = clientProperties();
        properties.setIssuerUri(issuer);
        properties.setTimeout(5000);

        return properties;
    }

    private OidcProperties configuredProperties() {
        OidcProperties properties = clientProperties();
        properties.setAuthorizationUri("https://idp.example.com/authorize");
        properties.setTokenUri("https://idp.example.com/token");
        properties.setJwkSetUri("https://idp.example.com/jwks");

        return properties;
    }

    private OidcProperties clientProperties() {
        OidcProperties properties = new OidcProperties();
        properties.setEnabled(true);
        properties.setClientId("opencelium");
        properties.setClientSecret("secret");
        properties.setRedirectUri("http://localhost:9090/oidc/callback");
        properties.setFrontendRedirectUri("http://localhost:5173/oidc/callback");

        return properties;
    }

    private static void respondJson(HttpExchange exchange, String body) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, payload.length);

        try (OutputStream response = exchange.getResponseBody()) {
            response.write(payload);
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
