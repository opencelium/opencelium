package com.becon.opencelium.backend.execution.notification;

import com.becon.opencelium.backend.execution.notification.enums.NotifyTool;
import com.becon.opencelium.backend.resource.notification.tool.teams.SectionType;
import com.becon.opencelium.backend.resource.notification.tool.teams.SectionValue;
import com.becon.opencelium.backend.resource.notification.tool.teams.TeamsDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TeamsService implements CommunicationTool {

    @Autowired
    private Environment env;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${opencelium.notification.tools.teams.client_id}")
    private String client_id;

    @Value("${opencelium.notification.tools.teams.client_secret}")
    private String client_secret;

    @Value("${opencelium.notification.tools.teams.grant_type}")
    private String grant_type;

    @Value("${opencelium.notification.tools.teams.refresh_token}")
    private String refresh_token;

    @Value("${opencelium.notification.tools.teams.refresh_token}")
    private String tenant;


    @Override
    public void sendMessage(String destination, String subject, String text) {
        String token = getToken(refresh_token);
        String[] teamChannelIds = destination.split(";");
        String teamId = teamChannelIds[0];
        String channelId = teamChannelIds[1];
        String sendMsgUrl = "https://graph.microsoft.com/v1.0/teams/" + teamId +
                "/channels/" + channelId + "/messages";
        HttpMethod method = HttpMethod.POST;
        String body = "{\n" +
                "    \"body\": {\n" +
                "        \"contentType\": \"html\",\n" +
                "        \"content\": \"<b>" + subject + "</b><br>" + text + "\"\n" +
                "    }\n" +
                "}";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        restTemplate.exchange(sendMsgUrl, method, httpEntity, String.class);
    }

    @Override
    public void sendMessageUsingTemplate(String to, String subject, String templateModel) {

    }

    public TeamsDto getAllTeams() {
        String token = getToken(refresh_token);
        HttpMethod method = HttpMethod.POST;

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", client_id);
        body.add("client_secret", client_secret);
        body.add("resource", "https://graph.microsoft.com/");

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        String url = "https://graph.microsoft.com/v1.0/teams";
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);
        ResponseEntity<String> response = restTemplate.exchange(url, method, httpEntity, String.class);
        TeamsDto teamsDto = convertToDto(response.getBody());
        teamsDto.setType(SectionType.TEAM);
        return teamsDto;
    }

    public TeamsDto getAllChannels(String teamId) {
        String token = getToken(refresh_token);
        HttpMethod method = HttpMethod.POST;

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", client_id);
        body.add("client_secret", client_secret);
        body.add("resource", "https://graph.microsoft.com/");

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        String url = "https://graph.microsoft.com/v1.0/teams/" + teamId + "/allChannels";
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);
        ResponseEntity<String> response = restTemplate.exchange(url, method, httpEntity, String.class);
        TeamsDto teamsDto = convertToDto(response.getBody());
        teamsDto.setType(SectionType.CHANNEL);
        return teamsDto;
    }

    private TeamsDto convertToDto(String jsonResponse) {

        try {
            Map<String, Object> jsonMap = objectMapper.readValue(jsonResponse, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> teams = (List<Map<String, Object>>) jsonMap.get("value");
            TeamsDto teamDto = new TeamsDto();
            List<SectionValue> sectionValues = new ArrayList<>();
            for (Map<String, Object> teamMap : teams) {
                String id = (String) teamMap.get("id");
                String displayName = (String) teamMap.get("displayName");
                String description = (String) teamMap.get("description");

                SectionValue sectionValue = new SectionValue();
                sectionValue.setId(id);
                sectionValue.setName(displayName);
                sectionValue.setDescription(description);

                sectionValues.add(sectionValue);
            }
            teamDto.setValue(sectionValues);
            return teamDto;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // return access token
    private String getToken(String refToken) {
        HttpMethod method = HttpMethod.POST;
        String loginUrl = "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", grant_type);
        body.add("client_id", client_id);
        body.add("client_secret", client_secret);
        body.add("refresh_token", refresh_token);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.CONTENT_TYPE, MediaType.MULTIPART_FORM_DATA_VALUE);
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, httpHeaders);

        ResponseEntity<String> response = restTemplate.exchange(loginUrl, method, httpEntity, String.class);

        return JsonPath.read(response.getBody(), "$.access_token");
    }
}
