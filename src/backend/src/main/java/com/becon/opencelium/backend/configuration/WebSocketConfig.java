package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.execution.socket.WebSocketHandshakeInterceptor;
import com.becon.opencelium.backend.execution.socket.handler.WebSocketEventHandler;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import static com.becon.opencelium.backend.execution.socket.SocketConstant.EXECUTION_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.execution.socket.SocketConstant.NOTIFICATION_DESTINATION_PREFIX;
import static com.becon.opencelium.backend.execution.socket.SocketConstant.PATH;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketEventHandler eventHandler;
    private final JwtTokenUtil jwtTokenUtil;

    public WebSocketConfig(WebSocketEventHandler eventHandler, JwtTokenUtil jwtTokenUtil) {
        this.eventHandler = eventHandler;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    /**
     * Configure the message broker for handling STOMP messages.
     * Enables a simple in-memory broker and sets the application destination prefix.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(EXECUTION_DESTINATION_PREFIX, NOTIFICATION_DESTINATION_PREFIX);
        registry.setApplicationDestinationPrefixes("/oc");
    }

    /**
     * Register STOMP endpoints used by clients to connect to the WebSocket server.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(PATH)
                .setAllowedOriginPatterns("*")
                .addInterceptors(new WebSocketHandshakeInterceptor(jwtTokenUtil))
                .withSockJS();
    }

    /**
     * Optional configuration for WebSocket transport settings.
     */
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        WebSocketMessageBrokerConfigurer.super.configureWebSocketTransport(registry);
    }

    /**
     * Configure an inbound channel interceptor to handle STOMP commands (e.g., CONNECT and DISCONNECT).
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                // Retrieve the STOMP header accessor to work with STOMP-specific headers.
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) {
                    return message;
                }

                // Determine the action (connect or disconnect) based on the STOMP command.
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    eventHandler.handleConnect(accessor);
                } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    eventHandler.handleDisconnect(accessor);
                }

                return ChannelInterceptor.super.preSend(message, channel);
            }
        });
    }
}
