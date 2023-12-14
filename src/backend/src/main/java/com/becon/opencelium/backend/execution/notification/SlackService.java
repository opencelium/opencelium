package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SlackService implements CommunicationTool {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${opencelium.notification.tools.slack.webhook}")
    private String url;

    @Override
    public void sendMessage(String destination, String subject, String text) {
        HttpMethod method = HttpMethod.POST;
        String body = "{" +
                            "\"text\": \"" + subject +
                                      "\n" + text + "\"\n" +
                      "}";
        if (destination != null && !destination.isEmpty()) {
            url  = destination;
        }
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        restTemplate.exchange(url, method, httpEntity, String.class);
    }

    @Override
    public void sendMessageUsingTemplate(String destination, String subject, String templateModel) {

    }
}
