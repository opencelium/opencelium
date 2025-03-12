package com.becon.opencelium.backend.execution.socket.handler;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import java.util.function.Function;

public enum WebSocketTopicType {
    SCHEDULER(accessor -> accessor.getSessionAttributes().containsKey("schedulerId")),
    SUPPORT_FILE(accessor -> accessor.getSessionAttributes().containsKey("supportFile"));

    private final Function<StompHeaderAccessor, Boolean> detectionFunction;

    WebSocketTopicType(Function<StompHeaderAccessor, Boolean> detectionFunction) {
        this.detectionFunction = detectionFunction;
    }

    public boolean matches(StompHeaderAccessor accessor) {
        return detectionFunction.apply(accessor);
    }

    public static WebSocketTopicType detectTopic(StompHeaderAccessor accessor) {
        return java.util.Arrays.stream(WebSocketTopicType.values())
                .filter(topic -> topic.matches(accessor))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Topic not found in query"));
    }
}
