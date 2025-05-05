package com.becon.opencelium.backend.execution.socket;

public interface SocketConstant {
    String PATH = "/websocket"; // WebSocket connection endpoint

    String EXECUTION_DESTINATION_PREFIX = "/execution"; // Message broker prefix for execution
    String LOGS_DESTINATION = "/execution/logs"; // WebSocket topic for execution logs
    String SUPPORT_FILE_DESTINATION = "/execution/support-file"; // WebSocket topic for support file

    String NOTIFICATION_DESTINATION_PREFIX = "/queue/subscription"; // Message broker prefix for user specific notification
    String NOTIFICATION_DESTINATION = "/queue/subscription"; // WebSocket topic for  user specific subscription notification
}
