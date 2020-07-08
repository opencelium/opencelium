package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private Environment env;

    @Override
    public void sendMessage(String to, String subject, String text) {

        String senderName = env.getProperty("opencelium.mail.from");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
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
