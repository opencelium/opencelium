package com.becon.opencelium.backend.execution.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class TeamsService implements CommunicationTool {

    @Autowired
    private Environment env;

    @Autowired
    private RestTemplate restTemplate;

    private String nTools = "opencelium.notification.tools";

    @Override
    public void sendMessage(String destination, String subject, String text) {
        String token = env.getProperty(nTools + ".teams.token");
        refreshToken(token);

        String channel = env.getProperty(nTools + ".teams.channel");
        String teams = env.getProperty(nTools + ".teams.teams");
        String sendMsgUrl = "https://graph.microsoft.com/v1.0/teams/" + teams +
                "/channels/" + channel + "/messages";
        HttpMethod method = HttpMethod.POST;
        String body = "{\n" +
                "    \"body\": {\n" +
                "        \"content\": \"Subject - " + subject + ". Message: " + text + "\"\n" +
                "    }\n" +
                "}";
        HttpHeaders httpHeaders = new HttpHeaders();

        httpHeaders.add(HttpHeaders.AUTHORIZATION, token);
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        restTemplate.exchange(sendMsgUrl, HttpMethod.POST, httpEntity, String.class);
    }

    @Override
    public void sendMessageUsingTemplate(String to, String subject, String templateModel) {

    }

    // return access token
    private void refreshToken(String token) {

        String tenant = env.getProperty(nTools + ".teams.tenant");
        String grantType = env.getProperty(nTools + ".teams.grant_type");
        String client_id = env.getProperty(nTools + ".teams.client_id");
        String client_secret = env.getProperty(nTools + ".teams.client_secret");
        String refresh_token = env.getProperty(nTools + ".teams.refresh_token");

        HttpMethod method = HttpMethod.POST;
        String loginUrl = "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", grantType);
        body.add("client_id", client_id);
        body.add("client_secret", client_secret);
        body.add("refresh_token", refresh_token);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.AUTHORIZATION, token);
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.MULTIPART_FORM_DATA_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        restTemplate.exchange(loginUrl, method, httpEntity, String.class);
    }
}
