package com.becon.opencelium.backend.websocket.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

import static com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor.PRINCIPAL_NAME_ATTRIBUTE;

/**
 * Creates the WebSocket Principal from the authenticated JWT identity
 */
@Component
public class JwtWebSocketHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String principal = (String) attributes.get(PRINCIPAL_NAME_ATTRIBUTE);

        if (principal != null && !principal.isBlank()) {
            return () -> principal;
        }

        return super.determineUser(request, wsHandler, attributes);
    }
}
