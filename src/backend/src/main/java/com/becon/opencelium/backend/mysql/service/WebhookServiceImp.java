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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.constant.SecurityConstant;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.entity.Webhook;
import com.becon.opencelium.backend.mysql.repository.WebhookRepository;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;
import com.becon.opencelium.backend.utility.TokenUtility;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import sun.tools.jstat.Token;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;

@Service
public class WebhookServiceImp implements WebhookService {

    @Autowired
    private WebhookRepository webhookRepository;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private TokenUtility tokenUtility;

    //TODO: rename method - gets some info from token
    @Override
    public Optional<WebhookTokenResource> getTokenObject(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(tokenUtility.getSecret().getBytes())
                .parseClaimsJws(token.replace(SecurityConstant.BEARER, ""))
                .getBody();

        String uuid = claims.get("uuid").toString();
        String tmp = claims.get("userId").toString();
        int schedulerId =  (int) claims.get("schedulerId");
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
        String token = generateToken(userId, uuid.toString(), scheduler.getId());

        webhook.setUuid(uuid.toString());
        webhook.setToken(token);
        webhook.setScheduler(scheduler);
        return webhookRepository.save(webhook);
    }

    @Override
    public String generateToken(int userId, String uuid, int schedulerId) {

        return Jwts.builder()
                .setSubject("webhook")
                .claim("userId", userId)
                .claim("uuid", uuid)
                .claim("schedulerId", schedulerId)
                .setId(Long.toString(schedulerId))
                .signWith(SignatureAlgorithm.HS256, tokenUtility.getSecret().getBytes())
                .compact();
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
}
