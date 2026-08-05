package com.becon.opencelium.backend.websocket.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import static com.becon.opencelium.backend.websocket.constant.SocketConstant.CONNECTOR_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.websocket.constant.SocketConstant.EXECUTION_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.websocket.constant.SocketConstant.NOTIFICATION_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.websocket.constant.SocketConstant.SCHEDULER_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.websocket.constant.SocketConstant.USER_SESSION_DESTINATION_PREFIX;

/**
 * Configures STOMP broker, endpoint, user destinations, origins, and handshake components
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtWebSocketHandshakeHandler handshakeHandler;
    private final JwtWebSocketHandshakeInterceptor handshakeInterceptor;
    private final String websocketEndpoint;

    public WebSocketConfig(
            JwtWebSocketHandshakeHandler handshakeHandler,
            JwtWebSocketHandshakeInterceptor handshakeInterceptor,
            @Value("${websocket.endpoint}") String websocketEndpoint
    ) {
        this.handshakeHandler = handshakeHandler;
        this.handshakeInterceptor = handshakeInterceptor;
        this.websocketEndpoint = websocketEndpoint;
    }


    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(
                EXECUTION_DESTINATION_PREFIX,
                NOTIFICATION_DESTINATION_PREFIX,
                SCHEDULER_DESTINATION_PREFIX,
                USER_SESSION_DESTINATION_PREFIX,
                CONNECTOR_DESTINATION_PREFIX
        );
        registry.setApplicationDestinationPrefixes("/oc");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(websocketEndpoint)
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(handshakeHandler)
                .addInterceptors(handshakeInterceptor)
                .withSockJS();
    }
}
