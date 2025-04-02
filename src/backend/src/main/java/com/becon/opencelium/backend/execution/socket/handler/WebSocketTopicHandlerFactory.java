package com.becon.opencelium.backend.execution.socket.handler;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketTopicHandlerFactory {

    private final Map<WebSocketHandlerType, WebSocketEventHandler> handlers = new ConcurrentHashMap<>();

    public WebSocketTopicHandlerFactory(List<WebSocketEventHandler> webSocketEventHandlers) {
        for (WebSocketEventHandler handler : webSocketEventHandlers) {
            handlers.put(handler.getEventType(), handler); // Register handler
        }
    }

    public WebSocketEventHandler getHandler(WebSocketHandlerType eventType) {
        return handlers.get(eventType); // Retrieve handler instantly
    }
}
