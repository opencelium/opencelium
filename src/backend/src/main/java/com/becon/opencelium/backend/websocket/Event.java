package com.becon.opencelium.backend.websocket;

public record Event(String event, String reason){
    public static Event of(String event, String reason) {
        return new Event(event, reason);
    }
}
