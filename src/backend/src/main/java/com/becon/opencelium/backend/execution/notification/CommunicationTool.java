package com.becon.opencelium.backend.execution.notification;

public interface CommunicationTool {
    void sendMessage(String destination, String subject, String text);
    void sendMessageUsingTemplate(String destination, String subject, String templateModel);
}
