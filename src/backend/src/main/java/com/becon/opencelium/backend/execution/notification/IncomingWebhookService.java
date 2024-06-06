package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

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
        Objects.requireNonNull(destination);
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        restTemplate.exchange(destination, method, httpEntity, String.class);
    }

    @Override
    public void sendMessageUsingTemplate(String destination, String subject, String templateModel) {

    }
}
