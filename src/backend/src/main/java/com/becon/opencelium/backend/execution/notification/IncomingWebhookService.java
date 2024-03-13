package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class IncomingWebhookService implements CommunicationTool {

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public void sendMessage(String destination, String subject, String text) {
            HttpMethod method = HttpMethod.POST;
            String body = "{" +
                    "\"text\": \"" + subject +
                    "\n" + text + "\"\n" +
                    "}";
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);
            restTemplate.exchange(destination, method, httpEntity, String.class);
    }

    @Override
    public void sendMessageUsingTemplate(String destination, String subject, String templateModel) {

    }
}
