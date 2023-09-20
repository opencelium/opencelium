package com.becon.opencelium.backend.execution.notification;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TeamsService implements CommunicationTool {
    @Override
    public void sendMessage(String destination, String subject, String text) {
        RestTemplate restTemplate = new RestTemplate();
        // url
        // body
        // header

    }

    @Override
    public void sendMessageUsingTemplate(String to, String subject, String templateModel) {

    }
}
