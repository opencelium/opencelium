package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.entity.OidcLoginTicket;
import com.becon.opencelium.backend.database.mysql.repository.OidcLoginTicketRepository;
import com.becon.opencelium.backend.utility.EmailUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationExchange;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class OidcLoginServiceImpl implements OidcLoginService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String CLAIM_EMAIL_VERIFIED = "email_verified";
    private static final String CLAIM_ISSUER = "iss";
    private static final String CLAIM_SUBJECT = "sub";

    private static final Logger logger = LoggerFactory.getLogger(OidcLoginServiceImpl.class);

    private final OidcProperties properties;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient;
    private final JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory;
    private final OidcLoginTicketRepository ticketRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public OidcLoginServiceImpl(OidcProperties properties,
                                ClientRegistrationRepository clientRegistrationRepository,
                                OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient,
                                JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory,
                                OidcLoginTicketRepository ticketRepository,
                                ObjectMapper objectMapper) {
        this.properties = properties;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.tokenResponseClient = tokenResponseClient;
        this.idTokenDecoderFactory = idTokenDecoderFactory;
        this.ticketRepository = ticketRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofMillis(properties.getTimeout()))
                .setReadTimeout(Duration.ofMillis(properties.getTimeout()))
                .build();
    }

    @Override
    public Start beginLogin(String clientNonce) {
        if (!StringUtils.hasText(clientNonce) || clientNonce.length() < MIN_CLIENT_NONCE_LENGTH) {
            throw new OidcLoginException("invalid_nonce",
                    "A client nonce of at least " + MIN_CLIENT_NONCE_LENGTH + " characters is required.");
        }

        ClientRegistration registration = clientRegistration();

        String state = randomValue();
        String nonce = randomValue();
        String codeVerifier = randomValue();

        String authorizationUri = UriComponentsBuilder
                .fromUriString(registration.getProviderDetails().getAuthorizationUri())
                .queryParam(OAuth2ParameterNames.RESPONSE_TYPE, "code")
                .queryParam(OAuth2ParameterNames.CLIENT_ID, registration.getClientId())
                .queryParam(OAuth2ParameterNames.REDIRECT_URI, properties.getRedirectUri())
                .queryParam(OAuth2ParameterNames.SCOPE, String.join(" ", registration.getScopes()))
                .queryParam(OAuth2ParameterNames.STATE, state)
                .queryParam(OidcParameterNames.NONCE, nonce)
                .queryParam(PkceParameterNames.CODE_CHALLENGE, codeChallenge(codeVerifier))
                .queryParam(PkceParameterNames.CODE_CHALLENGE_METHOD, "S256")
                .build()
                .encode()
                .toUriString();

        OidcAuthorizationState authorizationState = new OidcAuthorizationState(state, nonce, codeVerifier,
                properties.getRedirectUri(), hashClientNonce(clientNonce),
                System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(properties.getStateActivityTime()));

        return new Start(authorizationState, authorizationUri);
    }

    @Override
    public OidcIdentity completeLogin(String code, String state, OidcAuthorizationState expected) {
        ClientRegistration registration = clientRegistration();

        if (expected == null || !Objects.equals(expected.state(), state)) {
            throw new OidcLoginException("invalid_state",
                    "The 'state' returned by the identity provider does not match the authorization request.");
        }

        OAuth2AuthorizationRequest authorizationRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri(registration.getProviderDetails().getAuthorizationUri())
                .clientId(registration.getClientId())
                .redirectUri(expected.redirectUri())
                .scopes(new LinkedHashSet<>(registration.getScopes()))
                .state(state)
                .additionalParameters(Map.of(OidcParameterNames.NONCE, expected.nonce()))
                .attributes(Map.of(PkceParameterNames.CODE_VERIFIER, expected.codeVerifier()))
                .build();

        OAuth2AuthorizationResponse authorizationResponse = OAuth2AuthorizationResponse.success(code)
                .redirectUri(expected.redirectUri())
                .state(state)
                .build();

        OAuth2AccessTokenResponse tokenResponse;
        try {
            tokenResponse = tokenResponseClient.getTokenResponse(new OAuth2AuthorizationCodeGrantRequest(
                    registration,
                    new OAuth2AuthorizationExchange(authorizationRequest, authorizationResponse)));
        } catch (OAuth2AuthorizationException e) {
            throw new OidcLoginException("invalid_code",
                    "The authorization code could not be exchanged for tokens: " + e.getMessage(), e);
        }

        Jwt idToken = decodeIdToken(registration, tokenResponse);

        if (!Objects.equals(expected.nonce(), idToken.getClaimAsString(OidcParameterNames.NONCE))) {
            throw new OidcLoginException("invalid_token",
                    "The 'nonce' of the ID token does not match the authorization request.");
        }

        Map<String, Object> claims = new LinkedHashMap<>(idToken.getClaims());
        String userInfoUri = userInfoUri(registration);
        if (StringUtils.hasText(userInfoUri)) {
            Map<String, Object> userInfo = fetchUserInfo(userInfoUri, tokenResponse.getAccessToken());

            // OIDC Core 5.3.2: the UserInfo response belongs to the subject of the ID token, otherwise
            // it must not be used at all. The ID token is the validated source, so UserInfo only fills
            // in what the token does not carry already - it never overwrites a validated claim.
            if (Objects.equals(idToken.getSubject(), asString(userInfo.get(CLAIM_SUBJECT)))) {
                userInfo.forEach(claims::putIfAbsent);
            } else {
                logger.warn("Ignoring the UserInfo response: it describes subject '{}', but the ID token belongs to '{}'.",
                        userInfo.get(CLAIM_SUBJECT), idToken.getSubject());
            }
        }

        String email = asString(claims.get(properties.getEmailClaim()));
        if (!EmailUtility.isValid(email)) {
            throw new OidcLoginException("email_missing",
                    "The identity provider did not return a valid '" + properties.getEmailClaim() + "' claim.");
        }

        if (properties.isRequireVerifiedEmail() && !isTrue(claims.get(CLAIM_EMAIL_VERIFIED))) {
            throw new OidcLoginException("email_not_verified",
                    "The identity provider did not confirm '" + CLAIM_EMAIL_VERIFIED + "' for this email address.");
        }

        return new OidcIdentity(issuer(idToken), idToken.getSubject(), email,
                asGroups(claims.get(properties.getGroupClaim())), claims);
    }

    @Override
    @Transactional
    public String issueTicket(OidcIdentity identity, String clientNonceHash) {
        OidcLoginTicket ticket = new OidcLoginTicket();
        ticket.setTicket(randomValue());
        ticket.setIdentity(serialize(identity));
        ticket.setClientNonceHash(clientNonceHash);
        ticket.setExpiresAt(new Date(System.currentTimeMillis()
                + TimeUnit.SECONDS.toMillis(properties.getTicketActivityTime())));

        return ticketRepository.save(ticket).getTicket();
    }

    @Override
    @Transactional
    public OidcIdentity consumeTicket(String ticket, String clientNonce) {
        if (!StringUtils.hasText(ticket)) {
            throw new OidcLoginException("invalid_code", "No one-time code has been supplied.");
        }

        OidcLoginTicket found = ticketRepository.findForUpdate(ticket)
                .orElseThrow(() -> new OidcLoginException("invalid_code", "Unknown one-time code."));

        if (found.getUsedAt() != null || found.getExpiresAt().before(new Date())) {
            throw new OidcLoginException("invalid_code", "The one-time code has expired or was already used.");
        }

        // /oidc/exchange is reachable from any browser, so the ticket is only spent by the one that
        // started the login. Checked before the row is marked used, and a wrong nonce leaves it alone.
        if (!matchesClientNonce(found, clientNonce)) {
            throw new OidcLoginException("invalid_code", "The one-time code was not issued to this browser.");
        }

        found.setUsedAt(new Date());

        try {
            return objectMapper.readValue(found.getIdentity(), OidcIdentity.class);
        } catch (JsonProcessingException e) {
            throw new OidcLoginException("invalid_code", "The one-time code payload is corrupted.", e);
        }
    }

    private Jwt decodeIdToken(ClientRegistration registration, OAuth2AccessTokenResponse tokenResponse) {
        Object idTokenValue = tokenResponse.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);
        if (idTokenValue == null) {
            throw new OidcLoginException("invalid_token", "The identity provider did not return an ID token.");
        }

        try {
            return idTokenDecoderFactory.createDecoder(registration).decode(idTokenValue.toString());
        } catch (JwtException e) {
            throw new OidcLoginException("invalid_token", "The ID token is not valid: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> fetchUserInfo(String userInfoUri, OAuth2AccessToken accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken.getTokenValue());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(userInfoUri, HttpMethod.GET,
                    new HttpEntity<>(headers), new ParameterizedTypeReference<>() {
                    });

            return response.getBody() == null ? Map.of() : response.getBody();
        } catch (RestClientException e) {
            throw new OidcLoginException("userinfo_failed",
                    "The UserInfo endpoint could not be called: " + e.getMessage(), e);
        }
    }

    private ClientRegistration clientRegistration() {
        if (!properties.isEnabled()) {
            throw new OidcLoginException("oidc_disabled", "OpenID Connect is not enabled.");
        }

        ClientRegistration registration = clientRegistrationRepository
                .findByRegistrationId(OidcProperties.REGISTRATION_ID);

        if (registration == null) {
            throw new OidcLoginException("oidc_disabled", "No OpenID Connect client registration is configured.");
        }

        return registration;
    }

    private String userInfoUri(ClientRegistration registration) {
        return StringUtils.hasText(properties.getUserInfoUri())
                ? properties.getUserInfoUri()
                : registration.getProviderDetails().getUserInfoEndpoint().getUri();
    }

    private String serialize(OidcIdentity identity) {
        try {
            return objectMapper.writeValueAsString(identity);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot serialize the OIDC identity", e);
        }
    }

    private String randomValue() {
        byte[] value = new byte[32];
        SECURE_RANDOM.nextBytes(value);

        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String codeChallenge(String codeVerifier) {
        return sha256Base64(codeVerifier.getBytes(StandardCharsets.US_ASCII), "the PKCE code challenge");
    }

    /** Only the hash of the client nonce is left behind, on the cookie as well as on the ticket row. */
    private String hashClientNonce(String clientNonce) {
        return sha256Base64(clientNonce.getBytes(StandardCharsets.UTF_8), "the client nonce");
    }

    private String sha256Base64(byte[] value, String description) {
        try {
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (Exception e) {
            throw new IllegalStateException("Cannot compute " + description, e);
        }
    }

    private boolean matchesClientNonce(OidcLoginTicket ticket, String clientNonce) {
        String stored = ticket.getClientNonceHash();
        if (!StringUtils.hasText(stored) || !StringUtils.hasText(clientNonce)) {
            return false;
        }

        return MessageDigest.isEqual(stored.getBytes(StandardCharsets.UTF_8),
                hashClientNonce(clientNonce).getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Issuer the account gets linked to. The configured issuer wins, because that is the value the
     * ID token was validated against; the 'iss' claim is only used when the endpoints are given
     * manually instead of through discovery.
     */
    private String issuer(Jwt idToken) {
        if (StringUtils.hasText(properties.getIssuerUri())) {
            return properties.getIssuerUri();
        }

        String issuer = idToken.getClaimAsString(CLAIM_ISSUER);
        if (!StringUtils.hasText(issuer)) {
            throw new OidcLoginException("invalid_token",
                    "The ID token carries no '" + CLAIM_ISSUER + "' claim and no issuer-uri is configured.");
        }

        return issuer;
    }

    /** Providers are not consistent here: some send 'email_verified' as a string. */
    private boolean isTrue(Object value) {
        return Boolean.TRUE.equals(value)
                || (value instanceof String text && Boolean.parseBoolean(text.trim()));
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private List<String> asGroups(Object value) {
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }

        if (value instanceof String group && StringUtils.hasText(group)) {
            return List.of(group);
        }

        return List.of();
    }
}
