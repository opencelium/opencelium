package com.becon.opencelium.backend.websocket.config;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Authenticates the HTTP handshake with the bearer token passed as the {@code token} query
 * parameter, the same way {@code AuthorizationFilter} authenticates a request: the signature is
 * verified first, the user is loaded by the {@code userId} claim, and the token must belong to
 * that user's active session. Only then are the user id, OC session id and principal name stored
 * as session attributes for the STOMP layer.
 */
@Component
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_ID_ATTRIBUTE = "userId";
    public static final String OC_SESSION_ID_ATTRIBUTE = "ocSessionId";
    public static final String PRINCIPAL_NAME_ATTRIBUTE = "principal";

    private static final String TOKEN_PARAMETER = "token";

    private final JwtTokenUtil jwtTokenUtil;
    private final UserService userService;

    public JwtWebSocketHandshakeInterceptor(JwtTokenUtil jwtTokenUtil, UserService userService) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userService = userService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        String token = servletRequest
                .getServletRequest()
                .getParameter(TOKEN_PARAMETER);

        if (!hasBearerToken(token)) {
            return false;
        }

        JWTClaimsSet claims = jwtTokenUtil.verify(token.substring(7)).orElse(null);
        if (claims == null) {
            return false;
        }

        User user = jwtTokenUtil.userIdOf(claims)
                .flatMap(userService::findByIdNoLock)
                .orElse(null);
        if (user == null || !jwtTokenUtil.belongsToActiveSession(claims, user)) {
            return false;
        }

        attributes.put(USER_ID_ATTRIBUTE, user.getId());
        attributes.put(OC_SESSION_ID_ATTRIBUTE, claims.getJWTID());
        attributes.put(PRINCIPAL_NAME_ATTRIBUTE, user.getPrincipal());

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        // No action is required after the handshake.
    }


    private boolean hasBearerToken(String token) {
        return token != null && token.startsWith("Bearer ") && token.length() > 7;
    }
}
