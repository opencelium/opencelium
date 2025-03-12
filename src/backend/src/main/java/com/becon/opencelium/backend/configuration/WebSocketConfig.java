package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.execution.socket.SchedulerRegisterSession;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.execution.socket.handler.WebSocketTopicHandler;
import com.becon.opencelium.backend.execution.socket.handler.WebSocketTopicHandlerFactory;
import com.becon.opencelium.backend.execution.socket.handler.WebSocketTopicType;
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
import java.util.function.Consumer;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    // Factory to retrieve the appropriate WebSocketTopicHandler based on topic type.
    private final WebSocketTopicHandlerFactory handlerFactory;

    public WebSocketConfig(WebSocketTopicHandlerFactory handlerFactory) {
        this.handlerFactory = handlerFactory;
    }

    /**
     * Configure the message broker for handling STOMP messages.
     * Enables a simple in-memory broker and sets the application destination prefix.
     */

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(SocketConstant.DESTINATION_PREFIX);
        registry.setApplicationDestinationPrefixes("/oc");
    }

    /**
     * Register STOMP endpoints used by clients to connect to the WebSocket server.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(SocketConstant.PATH)
                .setAllowedOriginPatterns("*")
                .addInterceptors(myHandler())
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
     * Handshake interceptor that extracts information from the initial HTTP handshake request.
     * In this case, it extracts the 'schedulerId' parameter and stores it in the session attributes.
     */
    private HandshakeInterceptor myHandler() {
        return new HttpSessionHandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
                // Extract `schedulerId` from WebSocket connection URL (e.g., ws://server/socket?schedulerId=123)
                String ins = UriComponentsBuilder.fromUri(request.getURI()).build()
                        .getQueryParams().getFirst("schedulerId");
                if (ins == null) {
                    throw new RuntimeException("schedulerId for websocket not found");
                }
                int schedulerId = Integer.parseInt(ins);
                // // Store the schedulerId in the WebSocket session attributes for later use.
                attributes.put("schedulerId", schedulerId);
//                logger.info("Scheduler with id = " + schedulerId + " is set for websocket connection after handshake");
                return super.beforeHandshake(request, response, wsHandler, attributes);
            }
        };
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
                Consumer<WebSocketTopicHandler> handlerAction = null;
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    handlerAction = handler -> handler.handleConnect(accessor);
                } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    handlerAction = handler -> handler.handleDisconnect(accessor);
                }

                // If an action is defined, determine the topic type and retrieve the matching handler.
                if (handlerAction != null) {
                    // Automatically detect the topic type based on headers or session attributes.
                    WebSocketTopicType topicType = WebSocketTopicType.detectTopic(accessor);
                    // Retrieve the handler corresponding to the detected topic type.
                    WebSocketTopicHandler webSocketTopicHandler = handlerFactory.getHandler(topicType);
                    // Execute the determined action (connect/disconnect) on the retrieved handler.
                    handlerAction.accept(webSocketTopicHandler);
                }
                return ChannelInterceptor.super.preSend(message, channel);
            }
        });
    }
}
