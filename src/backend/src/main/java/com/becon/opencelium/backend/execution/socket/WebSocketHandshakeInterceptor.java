package com.becon.opencelium.backend.execution.socket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String schedulerId = servletRequest.getServletRequest().getParameter("schedulerId");
            String supportFile = servletRequest.getServletRequest().getParameter("supportFile");

            if (schedulerId != null) {
                attributes.put("schedulerId", Integer.valueOf(schedulerId));
            }

            if (supportFile != null) {
                attributes.put("supportFile", Boolean.valueOf(supportFile));
            }

            return true;
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {}
}

