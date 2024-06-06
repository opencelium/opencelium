package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.execution.socket.SocketConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    // Required for sending logs only for this scheduler other will be ignored;
    private static Integer schedulerId;

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

    public HandshakeInterceptor myHandler() {
        return new HttpSessionHandshakeInterceptor() {
            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
                String ins = UriComponentsBuilder.fromUri(request.getURI()).build()
                        .getQueryParams().getFirst("schedulerId");
                if (ins == null) {
                    throw new RuntimeException("schedulerId for websocket not found");
                }
                schedulerId = Integer.parseInt(ins);
                logger.info("Scheduler with id = " + schedulerId + " is set for websocket connection after handshake");
            }

        };
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                Object headerObj = message.getHeaders().get("simMessageType");
                String simpMsgType = "";
                if (headerObj instanceof String) {
                    simpMsgType = headerObj.toString();
                }
                if (simpMsgType.equals("DISCONNECT")) {
                    schedulerId = null;
                }
                return ChannelInterceptor.super.preSend(message, channel);
            }
        });
    }

    public static Integer getSchedulerId() {
        return schedulerId;
    }
}
