/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.security;

import com.becon.opencelium.backend.configuration.OidcConfiguration;
import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.entity.OidcLoginTicket;
import com.becon.opencelium.backend.database.mysql.repository.OidcLoginTicketRepository;
import com.becon.opencelium.backend.database.mysql.service.OidcLoginService;
import com.becon.opencelium.backend.database.mysql.service.OidcLoginServiceImpl;
import com.becon.opencelium.backend.security.oidc.OidcAuthorizationState;
import com.becon.opencelium.backend.security.oidc.OidcIdentity;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Exercises the whole server side of the login against a fake identity provider: discovery, the
 * PKCE parameters of the authorization request, the code exchange, ID token validation (issuer,
 * audience, expiry), the nonce check and the one-time ticket.
 *
 * The provider is a plain JDK HttpServer that signs its ID tokens with nimbus, so the test needs
 * neither Docker nor the Spring context; the beans under test come from {@link OidcConfiguration}
 * itself, so the client registration is built exactly as it is in production.
 *
 * Run with: ./gradlew test --tests "*.OidcLoginServiceImplTest"
 */
@DisplayName("OidcLoginServiceImpl — against a fake identity provider")
class OidcLoginServiceImplTest {

    private static final String CLIENT_ID = "opencelium";
    private static final String REDIRECT_URI = "http://localhost:9090/oidc/callback";

    private static HttpServer identityProvider;
    private static String issuer;
    private static RSAKey signingKey;
    private static String nonceToEcho;

    private OidcLoginServiceImpl oidcLoginService;
    private OidcProperties properties;
    private final Map<String, OidcLoginTicket> tickets = new HashMap<>();

    @BeforeAll
    static void startIdentityProvider() throws Exception {
        signingKey = new RSAKeyGenerator(2048).keyID("test-key").generate();

        identityProvider = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        issuer = "http://localhost:" + identityProvider.getAddress().getPort();

        identityProvider.createContext("/.well-known/openid-configuration",
                exchange -> respondJson(exchange, discoveryDocument()));
        identityProvider.createContext("/jwks",
                exchange -> respondJson(exchange, new JWKSet(signingKey.toPublicJWK()).toString()));
        identityProvider.createContext("/token", OidcLoginServiceImplTest::respondWithTokens);
        identityProvider.createContext("/userinfo", OidcLoginServiceImplTest::respondWithUserInfo);

        identityProvider.start();
    }

    @AfterAll
    static void stopIdentityProvider() {
        identityProvider.stop(0);
    }

    @BeforeEach
    void setUp() {
        properties = new OidcProperties();
        properties.setEnabled(true);
        properties.setIssuerUri(issuer);
        properties.setClientId(CLIENT_ID);
        properties.setClientSecret("client-secret");
        properties.setRedirectUri(REDIRECT_URI);
        properties.setFrontendRedirectUri("http://localhost:5173/oidc/callback");

        OidcConfiguration configuration = new OidcConfiguration();
        ClientRegistrationRepository clientRegistrations = configuration.oidcClientRegistrationRepository(properties);

        oidcLoginService = new OidcLoginServiceImpl(
                properties,
                clientRegistrations,
                configuration.oidcTokenResponseClient(properties),
                configuration.oidcIdTokenDecoderFactory(),
                ticketRepository(),
                new ObjectMapper().findAndRegisterModules());
    }

    @Test
    void beginLoginReturnsAuthorizationUriWithPkceAndNonceWhenDiscoveryIsAvailable() {
        OidcLoginService.Start start = oidcLoginService.beginLogin();

        // The consumer of this string is URI.create(...) in the controller: a raw space in the
        // scope parameter used to make it throw "Illegal character in query".
        assertThatCode(() -> URI.create(start.authorizationUri())).doesNotThrowAnyException();

        MultiValueMap<String, String> parameters = UriComponentsBuilder
                .fromUriString(start.authorizationUri())
                .build()
                .getQueryParams();

        assertThat(start.authorizationUri()).startsWith(issuer + "/authorize");
        assertThat(parameters.getFirst("response_type")).isEqualTo("code");
        assertThat(parameters.getFirst("client_id")).isEqualTo(CLIENT_ID);
        assertThat(parameters.getFirst("redirect_uri")).isEqualTo(REDIRECT_URI);
        assertThat(decode(parameters.getFirst("scope"))).isEqualTo("openid profile email");
        assertThat(parameters.getFirst("code_challenge_method")).isEqualTo("S256");
        assertThat(parameters.getFirst("code_challenge")).isNotBlank();
        assertThat(parameters.getFirst("state")).isEqualTo(start.state().state());
        assertThat(parameters.getFirst("nonce")).isEqualTo(start.state().nonce());
    }

    @Test
    void completeLoginReturnsIdentityWhenProviderAnswersWithValidTokens() {
        OidcLoginService.Start start = oidcLoginService.beginLogin();
        nonceToEcho = start.state().nonce();

        OidcIdentity identity = oidcLoginService.completeLogin("auth-code", start.state().state(), start.state());

        assertThat(identity.email()).isEqualTo("alice@example.com");
        assertThat(identity.subject()).isEqualTo("subject-1");
        assertThat(identity.groups()).containsExactly("oc-admins");
        assertThat(identity.claims()).containsEntry("department", "Platform");
    }

    @Test
    void completeLoginThrowsWhenStateDoesNotMatchTheAuthorizationRequest() {
        OidcLoginService.Start start = oidcLoginService.beginLogin();
        nonceToEcho = start.state().nonce();

        assertThatThrownBy(() -> oidcLoginService.completeLogin("auth-code", "another-state", start.state()))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "invalid_state");
    }

    @Test
    void completeLoginThrowsWhenStateIsMissingFromTheCallback() {
        OidcLoginService.Start start = oidcLoginService.beginLogin();
        nonceToEcho = start.state().nonce();

        assertThatThrownBy(() -> oidcLoginService.completeLogin("auth-code", null, start.state()))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "invalid_state");
    }

    @Test
    void completeLoginThrowsWhenIdTokenCarriesAnotherNonce() {
        OidcLoginService.Start start = oidcLoginService.beginLogin();
        nonceToEcho = "a-nonce-from-another-authorization-request";

        assertThatThrownBy(() -> oidcLoginService.completeLogin("auth-code", start.state().state(), start.state()))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "invalid_token");
    }

    @Test
    void completeLoginThrowsWhenIssuerIsNotEnabled() {
        properties.setEnabled(false);

        assertThatThrownBy(oidcLoginService::beginLogin)
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "oidc_disabled");
    }

    @Test
    void issueTicketReturnsIdentityWhenTicketIsFresh() {
        OidcIdentity identity = identity();

        OidcIdentity consumed = oidcLoginService.consumeTicket(oidcLoginService.issueTicket(identity));

        assertThat(consumed).isEqualTo(identity);
    }

    @Test
    void consumeTicketThrowsWhenTicketWasAlreadyUsed() {
        String ticket = oidcLoginService.issueTicket(identity());
        oidcLoginService.consumeTicket(ticket);

        assertThatThrownBy(() -> oidcLoginService.consumeTicket(ticket))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "invalid_code");
    }

    @Test
    void consumeTicketThrowsWhenTicketIsUnknown() {
        assertThatThrownBy(() -> oidcLoginService.consumeTicket("never-issued"))
                .isInstanceOf(OidcLoginException.class)
                .hasFieldOrPropertyWithValue("code", "invalid_code");
    }

    /** In-memory stand-in for the repository; the ticket lifecycle is what matters here. */
    private OidcLoginTicketRepository ticketRepository() {
        OidcLoginTicketRepository repository = mock(OidcLoginTicketRepository.class);

        when(repository.save(any(OidcLoginTicket.class))).thenAnswer(invocation -> {
            OidcLoginTicket ticket = invocation.getArgument(0);
            tickets.put(ticket.getTicket(), ticket);
            return ticket;
        });
        when(repository.findForUpdate(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(tickets.get(invocation.getArgument(0))));

        return repository;
    }

    private OidcIdentity identity() {
        return new OidcIdentity("subject-1", "alice@example.com", List.of("oc-admins"),
                Map.of("email", "alice@example.com"));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String discoveryDocument() {
        return """
                {
                  "issuer": "%s",
                  "authorization_endpoint": "%s/authorize",
                  "token_endpoint": "%s/token",
                  "jwks_uri": "%s/jwks",
                  "userinfo_endpoint": "%s/userinfo",
                  "response_types_supported": ["code"],
                  "subject_types_supported": ["public"],
                  "id_token_signing_alg_values_supported": ["RS256"]
                }
                """.formatted(issuer, issuer, issuer, issuer, issuer);
    }

    private static void respondWithTokens(HttpExchange exchange) throws IOException {
        try {
            String idToken = signedIdToken();

            respondJson(exchange, """
                    {
                      "access_token": "access-token",
                      "token_type": "Bearer",
                      "expires_in": 300,
                      "id_token": "%s"
                    }
                    """.formatted(idToken));
        } catch (Exception e) {
            respondJson(exchange, "{\"error\":\"server_error\"}", 500);
        }
    }

    /** Carries the claims that providers commonly expose only here, and proves the access token is forwarded. */
    private static void respondWithUserInfo(HttpExchange exchange) throws IOException {
        String authorization = exchange.getRequestHeaders().getFirst("Authorization");
        if (!"Bearer access-token".equals(authorization)) {
            respondJson(exchange, "{\"error\":\"invalid_token\"}", 401);
            return;
        }

        respondJson(exchange, """
                {
                  "email": "alice@example.com",
                  "groups": ["oc-admins"],
                  "department": "Platform"
                }
                """);
    }

    private static String signedIdToken() throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(CLIENT_ID)
                .subject("subject-1")
                .claim("email", "alice@example.com")
                .claim("groups", List.of("oc-admins"))
                .claim("nonce", nonceToEcho)
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plusSeconds(300)))
                .build();

        SignedJWT idToken = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        idToken.sign(new RSASSASigner(signingKey));

        return idToken.serialize();
    }

    private static void respondJson(HttpExchange exchange, String body) throws IOException {
        respondJson(exchange, body, 200);
    }

    private static void respondJson(HttpExchange exchange, String body, int status) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, payload.length);

        try (OutputStream response = exchange.getResponseBody()) {
            response.write(payload);
        }
    }
}
