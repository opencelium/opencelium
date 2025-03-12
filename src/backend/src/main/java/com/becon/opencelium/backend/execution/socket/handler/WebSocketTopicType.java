package com.becon.opencelium.backend.execution.socket.handler;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import java.util.Objects;
import java.util.function.Function;

/**
 * Enum representing the different types of WebSocket topics.
 * Each constant is associated with a detection function that determines if a given
 * {@link StompHeaderAccessor} matches the criteria for that topic.
 */
public enum WebSocketTopicType {
    // The SCHEDULER topic is detected if the session attributes contain a key "schedulerId".
    SCHEDULER(accessor -> Objects.requireNonNull(accessor.getSessionAttributes()).containsKey("schedulerId")),
    // The SUPPORT_FILE topic is detected if the session attributes contain a key "supportFile".
    SUPPORT_FILE(accessor -> Objects.requireNonNull(accessor.getSessionAttributes()).containsKey("supportFile"));

    // Function used to detect if a StompHeaderAccessor corresponds to this topic type.
    private final Function<StompHeaderAccessor, Boolean> detectionFunction;

    /**
     * Constructor that assigns a detection function to the enum constant.
     *
     * @param detectionFunction a function that checks if a StompHeaderAccessor matches this topic type.
     */
    WebSocketTopicType(Function<StompHeaderAccessor, Boolean> detectionFunction) {
        this.detectionFunction = detectionFunction;
    }

    /**
     * Tests whether the given STOMP header accessor matches this topic type using the detection function.
     *
     * @param accessor the STOMP header accessor to be checked.
     * @return true if the accessor meets the criteria for this topic, false otherwise.
     */
    public boolean matches(StompHeaderAccessor accessor) {
        return detectionFunction.apply(accessor);
    }

    /**
     * Iterates over all defined WebSocketTopicType values and returns the first one that matches
     * the given STOMP header accessor.
     *
     * @param accessor the STOMP header accessor containing session attributes and headers.
     * @return the detected WebSocketTopicType.
     * @throws RuntimeException if no matching topic type is found.
     */
    public static WebSocketTopicType detectTopic(StompHeaderAccessor accessor) {
        return java.util.Arrays.stream(WebSocketTopicType.values())
                .filter(topic -> topic.matches(accessor))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Topic not found in query"));
    }
}
