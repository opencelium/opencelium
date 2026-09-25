package com.becon.opencelium.backend.websocket.config;

import com.becon.opencelium.backend.security.JwtTokenUtil;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Extracts and validates JWT information during the HTTP handshake
 */
@Component
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_ID_ATTRIBUTE = "userId";
    public static final String OC_SESSION_ID_ATTRIBUTE = "ocSessionId";
    public static final String PRINCIPAL_NAME_ATTRIBUTE = "principal";

    private static final String TOKEN_PARAMETER = "token";

    private final JwtTokenUtil jwtTokenUtil;

    public JwtWebSocketHandshakeInterceptor(JwtTokenUtil jwtTokenUtil) {
        this.jwtTokenUtil = jwtTokenUtil;
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

        String jwt = token.substring(7);

        attributes.put(USER_ID_ATTRIBUTE, jwtTokenUtil.extractUserId(jwt));
        attributes.put(OC_SESSION_ID_ATTRIBUTE, jwtTokenUtil.extractSessionId(jwt));
        attributes.put(PRINCIPAL_NAME_ATTRIBUTE, jwtTokenUtil.extractPrincipal(jwt));

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
