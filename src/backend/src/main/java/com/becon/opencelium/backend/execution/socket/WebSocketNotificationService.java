package com.becon.opencelium.backend.execution.socket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketNotificationService {
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final Connection2WebSocketChannelMapping connection2ChannelMapping;

    public WebSocketNotificationService(
            SimpMessagingTemplate simpMessagingTemplate,
            Connection2WebSocketChannelMapping connection2ChannelMapping) {
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.connection2ChannelMapping = connection2ChannelMapping;
    }

    public <E> void sendLog(long connectionId, E message) {
        String channelId = connection2ChannelMapping.getChannelId(connectionId);

        if (channelId != null) {
            // channelId exists if websocket connection is established and open
            simpMessagingTemplate.convertAndSend(SocketConstant.LOGS_DESTINATION + "/" + channelId, message);
        }
    }

    public <E> void sendUserNotification(int userId, E message) {
        simpMessagingTemplate.convertAndSendToUser("user", "destination", message);
    }
}
