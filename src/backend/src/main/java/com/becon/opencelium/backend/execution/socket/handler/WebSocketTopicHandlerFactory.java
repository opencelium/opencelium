package com.becon.opencelium.backend.execution.socket.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketTopicHandlerFactory {

    private final Map<WebSocketTopicType, WebSocketTopicHandler> handlers = new ConcurrentHashMap<>();

    public WebSocketTopicHandlerFactory(List<WebSocketTopicHandler> webSocketEventHandlers) {
        for (WebSocketTopicHandler handler : webSocketEventHandlers) {
            handlers.put(handler.getEventType(), handler); // Register handler
        }
    }

    public WebSocketTopicHandler getHandler(WebSocketTopicType eventType) {
        return handlers.get(eventType); // Retrieve handler instantly
    }
}
