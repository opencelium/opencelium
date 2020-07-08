package com.becon.opencelium.backend.execution.notification;

public interface EmailService {
    void sendMessage(String to, String subject, String text);
    void sendMessageUsingTemplate(String to, String subject, String templateModel);
}
