/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.entity.Webhook;
import com.becon.opencelium.backend.database.mysql.repository.WebhookRepository;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;
import com.becon.opencelium.backend.security.JwtTokenUtil;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.*;

@Service
public class WebhookServiceImp implements WebhookService {

    @Autowired
    private WebhookRepository webhookRepository;

    @Autowired
    private UserServiceImpl userService;

    @Lazy
    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    //TODO: rename method - gets some info from token
    @Override
    public Optional<WebhookTokenResource> getTokenObject(String token) {
        JWTClaimsSet claims = jwtTokenUtil.getAllClaimsFromToken(token);

        String uuid = claims.getClaim("uuid").toString();
        String tmp = claims.getClaim("userId").toString();
        int schedulerId = ((Long)claims.getClaim("schedulerId")).intValue();
        int userId = Integer.parseInt(tmp);

        boolean userExists = userService.existsById(userId);
        boolean schedulerExists = schedulerService.existsById(schedulerId);

        if(!schedulerExists){
            throw new RuntimeException("SCHEDULER_NOT_FOUND");
        }

        if (!userExists){
            throw new RuntimeException("USER_NOT_FOUND");
        }

        WebhookTokenResource webhookToken = new WebhookTokenResource(userId ,uuid, schedulerId);

        return Optional.of(webhookToken);
    }

    @Override
    public Webhook save(int userId, Scheduler scheduler) {
        Webhook webhook = new Webhook();
        UUID uuid = UUID.randomUUID();
        String token = generateWebhookToken(userId, uuid.toString(), scheduler.getId());

        webhook.setUuid(uuid.toString());
        webhook.setToken(token);
        webhook.setScheduler(scheduler);
        return webhookRepository.save(webhook);
    }

    @Override
    public String generateWebhookToken(int userId, String uuid, int schedulerId) {
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject("webhook")
                .claim("userId", userId)
                .claim("uuid", uuid)
                .claim("schedulerId", schedulerId)
                .jwtID(Long.toString(schedulerId))
                .build();

        return jwtTokenUtil.generateToken(claimsSet);
    }

    @Override
    public int getConnectionIdByUrl() {
        return 0;
    }

    @Override
    public Optional<Webhook> findById(int id) {
        return webhookRepository.findById(id);
    }

    @Override
    public Optional<Webhook> findBySchedulerId(int id) {
        return webhookRepository.findBySchedulerId(id);
    }


    @Override
    public Optional<Webhook> findByUIID(String uuid) {
        return webhookRepository.findByUuid(uuid);
//        return null;
    }

    @Override
    public String buildUrl(Webhook webhook) {
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return uri.getScheme() + "://" + uri.getAuthority() + "/api/webhook/execute/" + webhook.getToken();
    }

    @Override
    public void deleteById(int id) {
        webhookRepository.deleteById(id);
    }

    @Override
    public WebhookResource toResource(Webhook webhook) {
        //TODO: need to create resource factory for initializing resources
        WebhookResource webhookResource = new WebhookResource();
        webhookResource.setWebhookId(webhook.getId());
        webhookResource.setUrl(buildUrl(webhook));
        return webhookResource;
    }

    @Override
    public void deleteAllBySchedulerId(int id) {
        webhookRepository.deleteAllBySchedulerId(id);
    }

    @Override
    public boolean existsBySchedulerId(int id) {
        return webhookRepository.existsBySchedulerId(id);
    }

    @Override
    public WebhookParamDTO toParamResource(String param) { // param = val:type; type = [string, int, double, boolean, array]
        WebhookParamDTO webhookParamDTO = new WebhookParamDTO();
        String[] var = param.split(":");
        if (var.length == 0) {
            throw new RuntimeException("One of webhook parameters is empty");
        }
        webhookParamDTO.setName(var[0]);
        if (var.length == 1) {
            webhookParamDTO.setType("string");
        } else {
            webhookParamDTO.setType(var[1]);
        }
        return webhookParamDTO;
    }

    public Map<String, Object> convertToArrayList(Map<String, Object> inputMap) {
        Map<String, Object> result = new HashMap<>();

        for (Map.Entry<String, Object> entry : inputMap.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof String) {
                String strValue = (String) value;

                if (strValue.startsWith("[") && strValue.endsWith("]")) {
                    result.put(key, parseStringToArrayList(strValue));
                } else {
                    result.put(key, value);
                }
            } else {
                result.put(key, value);
            }
        }

        return result;
    }

    private static Object parseStringToArrayList(String strValue) {
        strValue = strValue.substring(1, strValue.length() - 1); // Remove the brackets

        if (strValue.contains("[")) {
            // This is a nested array
            return parseNestedArray(strValue);
        } else {
            // This is a simple array
            return parseSimpleArray(strValue);
        }
    }

    private static ArrayList<Object> parseSimpleArray(String strValue) {
        ArrayList<Object> list = new ArrayList<>();

        String[] values = strValue.split(",");
        for (String val : values) {
            val = val.trim();
            if (val.matches("-?\\d+(\\.\\d+)?")) {
                // Check if it's a number
                if (val.contains(".")) {
                    list.add(Double.parseDouble(val));
                } else {
                    list.add(Integer.parseInt(val));
                }
            } else {
                // Assume it's a string
                list.add(val);
            }
        }

        return list;
    }

    private static ArrayList<Object> parseNestedArray(String strValue) {
        ArrayList<Object> outerList = new ArrayList<>();
        int level = 0;
        StringBuilder sb = new StringBuilder();

        for (char ch : strValue.toCharArray()) {
            if (ch == '[') {
                if (level > 0) sb.append(ch);
                level++;
            } else if (ch == ']') {
                level--;
                if (level > 0) sb.append(ch);
                if (level == 0) {
                    outerList.add(parseStringToArrayList("[" + sb.toString() + "]"));
                    sb.setLength(0);
                }
            } else {
                if (level > 0) sb.append(ch);
            }
        }

        return outerList;
    }
}
