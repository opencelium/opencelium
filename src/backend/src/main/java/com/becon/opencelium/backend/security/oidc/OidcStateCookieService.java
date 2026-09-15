package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.utility.TokenUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * Keeps 'state', 'nonce' and the PKCE code verifier between the authorization redirect and the
 * callback. They live in a signed cookie rather than in a session, because the session policy is
 * STATELESS and no HttpSession is available.
 */
@Component
public class OidcStateCookieService {

    public static final String COOKIE_NAME = "oc_oidc_state";

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final ObjectMapper objectMapper;
    private final TokenUtility tokenUtility;

    public OidcStateCookieService(ObjectMapper objectMapper, TokenUtility tokenUtility) {
        this.objectMapper = objectMapper;
        this.tokenUtility = tokenUtility;
    }

    public void write(HttpServletResponse response, OidcAuthorizationState state, boolean secure) {
        Duration maxAge = Duration.ofMillis(Math.max(0, state.expiresAt() - System.currentTimeMillis()));

        String cookie = ResponseCookie.from(COOKIE_NAME, serialize(state))
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build()
                .toString();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie);
    }

    public Optional<OidcAuthorizationState> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> COOKIE_NAME.equals(cookie.getName()))
                .findFirst()
                .flatMap(cookie -> deserialize(cookie.getValue()));
    }

    public void clear(HttpServletResponse response) {
        String cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build()
                .toString();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie);
    }

    private String serialize(OidcAuthorizationState state) {
        try {
            String payload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(state));

            return payload + "." + sign(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot serialize OIDC authorization state", e);
        }
    }

    private Optional<OidcAuthorizationState> deserialize(String value) {
        int separator = value.lastIndexOf('.');
        if (separator < 1) {
            return Optional.empty();
        }

        String payload = value.substring(0, separator);
        String signature = value.substring(separator + 1);

        if (!MessageDigest.isEqual(sign(payload).getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }

        try {
            OidcAuthorizationState state = objectMapper
                    .readValue(Base64.getUrlDecoder().decode(payload), OidcAuthorizationState.class);

            return state.expiresAt() > System.currentTimeMillis() ? Optional.of(state) : Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(tokenUtility.getSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));

            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign OIDC authorization state", e);
        }
    }
}
