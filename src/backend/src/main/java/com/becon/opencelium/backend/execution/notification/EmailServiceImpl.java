package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class EmailServiceImpl implements CommunicationTool {

    @Autowired(required = false)
    private JavaMailSender emailSender;

    @Autowired
    private Environment env;

    @Override
    public void sendMessage(String destination, String subject, String text) {
        if (emailSender == null) {
            return;
        }

        String senderName = env.getProperty("spring.mail.opencelium.from");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destination);
            message.setSubject(subject);
            message.setText(text);
            if (senderName != null && !senderName.isEmpty()) {
                message.setFrom(senderName);
            }

            emailSender.send(message);
        } catch (MailException exception) {
            exception.printStackTrace();
        }
    }

    @Override
    public void sendMessageUsingTemplate(String to, String subject, String templateModel) {
        String text = templateModel;
        sendMessage(to, subject, text);
    }
}
