package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.execution.socket.SocketConstant;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(SocketConstant.DESTINATION_PREFIX);
        registry.setApplicationDestinationPrefixes("/oc");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(SocketConstant.PATH).setAllowedOriginPatterns("*").withSockJS();
    }

//    @Override
//    public void configureClientInboundChannel(ChannelRegistration registration) {
//        registration.interceptors(new ChannelInterceptor() {
//            @Override
//            public Message<?> preSend(Message<?> message, MessageChannel channel) {
//                System.out.println("inside interceptor");
//                return ChannelInterceptor.super.preSend(message, channel);
//            }
//        });
//    }

    //
//
//
//    @Bean
//    public WebSocketHandler myHandler() {
//        return new MyHandler();
//    }
}
