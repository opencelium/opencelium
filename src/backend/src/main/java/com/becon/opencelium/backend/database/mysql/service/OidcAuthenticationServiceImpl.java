/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.configuration.OidcClientRegistrationProvider;
import com.becon.opencelium.backend.configuration.OidcProperties;
import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.entity.UserRole;
import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.becon.opencelium.backend.security.oidc.OidcAuthorization;
import com.becon.opencelium.backend.security.oidc.OidcLoginException;
import com.becon.opencelium.backend.security.oidc.OidcLoginTicket;
import com.becon.opencelium.backend.security.oidc.OidcLoginTransaction;
import com.becon.opencelium.backend.utility.EmailUtility;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.endpoint.DefaultAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.oidc.authentication.OidcIdTokenDecoderFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationExchange;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponse;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Service
public class OidcAuthenticationServiceImpl implements OidcAuthenticationService {
    private static final Logger logger = LoggerFactory.getLogger(OidcAuthenticationServiceImpl.class);
    private static final long TICKET_TTL_MS = 60_000;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Base64.Encoder base64Url = Base64.getUrlEncoder().withoutPadding();
    // Package-private (not private final) so tests can inject mocked OAuth2 collaborators.
    JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory = new OidcIdTokenDecoderFactory();
    DefaultAuthorizationCodeTokenResponseClient tokenResponseClient = new DefaultAuthorizationCodeTokenResponseClient();
    private final Map<String, OidcLoginTicket> tickets = new ConcurrentHashMap<>();

    @Autowired
    private OidcProperties properties;

    @Autowired
    private OidcClientRegistrationProvider registrationProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRoleService userRoleService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public OidcAuthorization createAuthorization(String backendRedirectUri, String frontendRedirectUri) {
        ClientRegistration registration = registrationProvider.get();

        String state = randomToken();
        String nonce = randomToken();
        String codeVerifier = randomToken();
        String codeChallenge = sha256Base64Url(codeVerifier);

        OAuth2AuthorizationRequest request = OAuth2AuthorizationRequest.authorizationCode()
                .clientId(registration.getClientId())
                .authorizationUri(registration.getProviderDetails().getAuthorizationUri())
                .redirectUri(backendRedirectUri)
                .scopes(new HashSet<>(registration.getScopes()))
                .state(state)
                .additionalParameters(params -> {
                    params.put(OidcParameterNames.NONCE, nonce);
                    params.put(PkceParameterNames.CODE_CHALLENGE, codeChallenge);
                    params.put(PkceParameterNames.CODE_CHALLENGE_METHOD, "S256");
                })
                .build();

        OidcLoginTransaction transaction =
                new OidcLoginTransaction(state, nonce, codeVerifier, backendRedirectUri, frontendRedirectUri);

        return new OidcAuthorization(request.getAuthorizationRequestUri(), transaction);
    }

    @Override
    public String login(String code, OidcLoginTransaction transaction, String backendRedirectUri) {
        ClientRegistration registration = registrationProvider.get();

        OAuth2AccessTokenResponse tokenResponse = exchangeCode(registration, code, transaction, backendRedirectUri);
        Jwt idToken = validateIdToken(registration, tokenResponse, transaction);

        Map<String, Object> claims = collectClaims(idToken, tokenResponse);
        User user = provision(claims);

        String roleName = resolveRole(claims);
        UserRole role = userRoleService.findByRole(roleName)
                .orElseThrow(() -> new EntityNotFoundException(
                        "OIDC group mapped to role = '" + roleName + "', but it does not exist in OC system."));
        user.setUserRole(role);

        User saved = userService.save(user);
        Session session = sessionService.replace(saved.getId());
        saved.setSession(session);

        String token = jwtTokenUtil.generateToken(saved);
        String oneTimeCode = UUID.randomUUID().toString();
        purgeExpiredTickets();
        tickets.put(oneTimeCode, new OidcLoginTicket(saved.getId(), token, System.currentTimeMillis() + TICKET_TTL_MS));

        logger.info("User {} is authenticated via OIDC, role '{}' assigned", saved.getPrincipal(), role.getName());
        return oneTimeCode;
    }

    @Override
    public OidcLoginTicket consumeTicket(String oneTimeCode) {
        if (oneTimeCode == null) {
            throw new OidcLoginException("invalid_code");
        }
        OidcLoginTicket ticket = tickets.remove(oneTimeCode);
        if (ticket == null || ticket.getExpiresAt() < System.currentTimeMillis()) {
            throw new OidcLoginException("invalid_code");
        }
        return ticket;
    }

    private OAuth2AccessTokenResponse exchangeCode(ClientRegistration registration, String code,
                                                   OidcLoginTransaction transaction, String backendRedirectUri) {
        OAuth2AuthorizationResponse authorizationResponse = OAuth2AuthorizationResponse.success(code)
                .redirectUri(backendRedirectUri)
                .state(transaction.getState())
                .build();

        OAuth2AuthorizationRequest authorizationRequest = OAuth2AuthorizationRequest.authorizationCode()
                .clientId(registration.getClientId())
                .authorizationUri(registration.getProviderDetails().getAuthorizationUri())
                .redirectUri(backendRedirectUri)
                .scopes(new HashSet<>(registration.getScopes()))
                .state(transaction.getState())
                .attributes(attrs -> attrs.put(PkceParameterNames.CODE_VERIFIER, transaction.getCodeVerifier()))
                .build();

        OAuth2AuthorizationExchange exchange = new OAuth2AuthorizationExchange(authorizationRequest, authorizationResponse);
        try {
            return tokenResponseClient.getTokenResponse(new OAuth2AuthorizationCodeGrantRequest(registration, exchange));
        } catch (OAuth2AuthorizationException e) {
            throw new OidcLoginException("token_exchange_failed", e);
        }
    }

    private Jwt validateIdToken(ClientRegistration registration, OAuth2AccessTokenResponse tokenResponse,
                                OidcLoginTransaction transaction) {
        Object idTokenValue = tokenResponse.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);
        if (idTokenValue == null) {
            throw new OidcLoginException("missing_id_token");
        }
        Jwt idToken;
        try {
            idToken = idTokenDecoderFactory.createDecoder(registration).decode(idTokenValue.toString());
        } catch (Exception e) {
            throw new OidcLoginException("invalid_id_token", e);
        }
        if (!Objects.equals(transaction.getNonce(), idToken.getClaimAsString("nonce"))) {
            throw new OidcLoginException("invalid_nonce");
        }
        return idToken;
    }

    private Map<String, Object> collectClaims(Jwt idToken, OAuth2AccessTokenResponse tokenResponse) {
        Map<String, Object> claims = new HashMap<>(idToken.getClaims());
        // UserInfo is queried only when explicitly configured (e.g. groups not present in the ID token).
        if (StringUtils.hasText(properties.getUserInfoUri())) {
            claims.putAll(fetchUserInfo(tokenResponse.getAccessToken().getTokenValue()));
        }
        return claims;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                    properties.getUserInfoUri(), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            return response.getBody() != null ? response.getBody() : Map.of();
        } catch (Exception e) {
            throw new OidcLoginException("userinfo_failed", e);
        }
    }

    private User provision(Map<String, Object> claims) {
        String username = stringClaim(claims, properties.getUsernameClaim());
        if (username == null) {
            username = stringClaim(claims, "sub");
        }
        if (username == null) {
            throw new OidcLoginException("missing_username_claim");
        }
        String email = stringClaim(claims, properties.getEmailClaim());

        Optional<User> existing = userService.findByUsernameAndAuthMethod(username, AuthMethod.OIDC);
        if (existing.isPresent()) {
            User user = existing.get();
            applyProfile(user.getUserDetail(), claims);
            return user;
        }
        if (!properties.isJitProvisioning()) {
            throw new OidcLoginException("user_not_provisioned");
        }

        User user = new User();
        if (email != null && EmailUtility.isEmail(email)) {
            user.setEmail(email);
        } else if (EmailUtility.isEmail(username)) {
            user.setEmail(username);
        }
        user.setUsername(username);
        user.setAuthMethod(AuthMethod.OIDC);

        UserDetail userDetail = new UserDetail();
        userDetail.setLang(LangEnum.EN.getCode());
        userDetail.setTutorial(false);
        userDetail.setUser(user);
        applyProfile(userDetail, claims);
        user.setUserDetail(userDetail);

        return user;
    }

    private void applyProfile(UserDetail userDetail, Map<String, Object> claims) {
        if (userDetail == null) {
            return;
        }
        setIfPresent(stringClaim(claims, properties.getGivenNameClaim()), userDetail::setName);
        setIfPresent(stringClaim(claims, properties.getFamilyNameClaim()), userDetail::setSurname);
        setIfPresent(stringClaim(claims, properties.getPhoneNumberClaim()), userDetail::setPhoneNumber);
        setIfPresent(stringClaim(claims, properties.getDepartmentClaim()), userDetail::setDepartment);
        setIfPresent(stringClaim(claims, properties.getOrganizationClaim()), userDetail::setOrganization);
    }

    private void setIfPresent(String value, Consumer<String> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }

    private String resolveRole(Map<String, Object> claims) {
        List<String> groups = extractGroups(claims);
        if (groups.isEmpty()) {
            return properties.getDefaultRole();
        }
        List<String> mappedGroups = properties.getGroups();
        return groups.stream()
                .filter(mappedGroups::contains)
                .map(properties::getRoleByGroup)
                .findFirst()
                .orElse(properties.getDefaultRole());
    }

    private List<String> extractGroups(Map<String, Object> claims) {
        Object raw = claims.get(properties.getGroupsClaim());
        if (raw == null) {
            return List.of();
        }
        if (raw instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        if (raw instanceof String value) {
            return Arrays.stream(value.split("[ ,]+")).filter(StringUtils::hasText).toList();
        }
        return List.of(String.valueOf(raw));
    }

    private String stringClaim(Map<String, Object> claims, String name) {
        Object value = name == null ? null : claims.get(name);
        return value == null ? null : String.valueOf(value);
    }

    private void purgeExpiredTickets() {
        long now = System.currentTimeMillis();
        tickets.entrySet().removeIf(entry -> entry.getValue().getExpiresAt() < now);
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return base64Url.encodeToString(bytes);
    }

    private String sha256Base64Url(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII));
            return base64Url.encodeToString(digest);
        } catch (Exception e) {
            throw new OidcLoginException("pkce_generation_failed", e);
        }
    }
}
