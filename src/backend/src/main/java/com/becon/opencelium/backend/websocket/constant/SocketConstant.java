package com.becon.opencelium.backend.websocket.constant;

public interface SocketConstant {
    String EXECUTION_DESTINATION_PREFIX = "/execution"; // Message broker prefix for execution
    String LOGS_DESTINATION = "/execution/logs"; // WebSocket topic for execution logs
    String SUPPORT_FILE_DESTINATION = "/execution/support-file"; // WebSocket topic for support file

    String NOTIFICATION_DESTINATION_PREFIX = "/subscription"; // Message broker prefix for user notifications
    String NOTIFICATION_DESTINATION = "/subscription"; // WebSocket topic for user subscription notifications
    String SYSTEM_METRICS_DESTINATION = "/subscription/system/metrics"; // WebSocket topic for live system metrics

    String SCHEDULER_DESTINATION_PREFIX = "/scheduler/running/all";
    String SCHEDULER_DESTINATION = "/scheduler/running/all";

    String USER_SESSION_DESTINATION_PREFIX = "/session";
    String USER_SESSION_DESTINATION = "/session";

    String CONNECTOR_DESTINATION_PREFIX = "/connector"; // Message broker prefix for connector events
    String CONNECTOR_STATUS_DESTINATION = "/connector/status"; // WebSocket topic for connector health status
}
