package com.becon.opencelium.backend.websocket.lifecycle;

import com.becon.opencelium.backend.websocket.connection.WebSocketConnectionRegistry;
import com.becon.opencelium.backend.websocket.notification.WebSocketNotificationQueue;
import com.becon.opencelium.backend.websocket.subscription.WebSocketSubscriptionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import static com.becon.opencelium.backend.websocket.config.JwtWebSocketHandshakeInterceptor.USER_ID_ATTRIBUTE;

@Component
public class WebSocketSessionEventListener {
    private final WebSocketConnectionRegistry connectionRegistry;
    private final WebSocketSubscriptionRegistry subscriptionRegistry;
    private final WebSocketNotificationQueue notificationQueue;

    private static final Logger logger = LoggerFactory.getLogger(WebSocketSessionEventListener.class);

    public WebSocketSessionEventListener(
            WebSocketConnectionRegistry connectionRegistry,
            WebSocketSubscriptionRegistry subscriptionRegistry,
            WebSocketNotificationQueue notificationQueue
    ) {
        this.connectionRegistry = connectionRegistry;
        this.subscriptionRegistry = subscriptionRegistry;
        this.notificationQueue = notificationQueue;
    }

    @EventListener
    public void onConnected(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        connectionRegistry.handleConnect(accessor);
    }

    @EventListener
    public void onSubscribed(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        Integer userId = (Integer) accessor
                .getSessionAttributes()
                .get(USER_ID_ATTRIBUTE);
        String destination = accessor.getDestination();

        if (userId == null || destination == null) {
            logger.warn("Cannot register WebSocket subscription: userId={}, destination={}", userId, destination);
            return;
        }

        subscriptionRegistry.add(userId, destination);
        notificationQueue.check(destination);
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        Integer userId = (Integer) accessor
                .getSessionAttributes()
                .get(USER_ID_ATTRIBUTE);
        String destination = accessor.getDestination();

        connectionRegistry.handleDisconnect(accessor);

        if (destination != null) {
            subscriptionRegistry.remove(userId, destination);
        } else {
            subscriptionRegistry.remove(userId);
        }
    }
}
