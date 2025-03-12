package com.becon.opencelium.backend.execution.socket;

public interface SocketConstant {
    String DESTINATION_EXECUTION_LOG = "/execution/logs"; // WebSocket topic for execution logs
    String PATH = "/websocket"; // WebSocket connection endpoint
    String DESTINATION_PREFIX = "/execution"; // Message broker prefix
}
