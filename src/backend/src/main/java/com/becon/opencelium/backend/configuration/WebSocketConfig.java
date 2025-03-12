package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.execution.socket.SchedulerRegisterSession;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    private final SchedulerRegisterSession schedulerRegisterSession;

    public WebSocketConfig(SchedulerRegisterSession schedulerRegisterSession) {
        this.schedulerRegisterSession = schedulerRegisterSession;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(SocketConstant.DESTINATION_PREFIX);
        registry.setApplicationDestinationPrefixes("/oc");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(SocketConstant.PATH).setAllowedOriginPatterns("*")
                .addInterceptors(myHandler()).withSockJS();
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        WebSocketMessageBrokerConfigurer.super.configureWebSocketTransport(registry);
    }

    private HandshakeInterceptor myHandler() {
        return new HttpSessionHandshakeInterceptor() {
            /**
             * Before the WebSocket handshake, extract `schedulerId` from query parameters and store it in attributes.
             */
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                // Extract `schedulerId` from WebSocket connection URL (e.g., ws://server/socket?schedulerId=123)
                String ins = UriComponentsBuilder.fromUri(request.getURI()).build()
                        .getQueryParams().getFirst("schedulerId");
                if (ins == null) {
                    throw new RuntimeException("schedulerId for websocket not found");
                }
                int schedulerId = Integer.parseInt(ins);
                // Store the schedulerId in WebSocket session attributes
                attributes.put("schedulerId", schedulerId);
//                logger.info("Scheduler with id = " + schedulerId + " is set for websocket connection after handshake");
                return super.beforeHandshake(request, response, wsHandler, attributes);
            }
        };
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }
                String sessionId = accessor.getSessionId();

                // Handle CONNECT event (when the client successfully connects to WebSocket)
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Retrieve schedulerId stored during handshake
                    Integer schedulerId = (Integer) accessor.getSessionAttributes().get("schedulerId");

                    if (schedulerId != null) {
                        schedulerRegisterSession.addScheduler(schedulerId); // Add schedulerId
                        logger.info("Scheduler ID " + schedulerId + " registered for WebSocket session " + sessionId);
                    } else {
                        logger.warn("No scheduler ID found for session: " + sessionId);
                    }
                }

                // Handle DISCONNECT event (when the client disconnects)
                if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    Integer schedulerId = (Integer) accessor.getSessionAttributes().get("schedulerId");

                    if (schedulerId != null) {
                        schedulerRegisterSession.removeScheduler(schedulerId); //Remove schedulerId
                        logger.info("Scheduler ID " + schedulerId + " removed from WebSocket session " + sessionId);
                    }
                }
                return ChannelInterceptor.super.preSend(message, channel);
            }
        });
    }
}
