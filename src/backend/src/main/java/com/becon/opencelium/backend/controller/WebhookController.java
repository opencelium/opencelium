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

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.entity.Webhook;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.mysql.service.WebhookServiceImp;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@Controller
@RequestMapping(value = "/api/webhook")
public class WebhookController {

    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private WebhookServiceImp webhookService;

    //    @ResponseBody
    @GetMapping("execute/{token}")
    public ResponseEntity<?> executeConnection(@PathVariable("token") String token, @RequestParam Map<String, Object> queryParam) {
        WebhookTokenResource webhookToken = webhookService.getTokenObject(token).orElse(null);
        if (webhookToken == null){
            throw new RuntimeException("TOKEN_NOT_FOUND");
        }

        Webhook webhook = webhookService.findByUIID(webhookToken.getUuid()).orElse(null);
        if (webhook == null){
            throw new RuntimeException("WEBHOOK_NOT_FOUND");
        }

        if (!webhook.getUuid().equals(webhookToken.getUuid())){
            throw new RuntimeException("WEBHOOK_UUID_WRONG");
        }

        Scheduler scheduler = schedulerService.findById(webhookToken.getSchedulerId()).orElse(null);
        if (scheduler == null){
            throw new RuntimeException("SCHEDULER_NOT_FOUND");
        }

        try {
            if (queryParam.isEmpty()) {
                schedulerService.startNow(scheduler);
            } else {
                schedulerService.startNow(scheduler, queryParam);
            }
        }
        catch (Exception e){
            throw new RuntimeException(e);
        }

        return  ResponseEntity.ok().build();
    }

    @GetMapping(value = "/url/{userId}/{schedulerId}", produces = "application/hal+json")
    public ResponseEntity<?> generateUrl(@PathVariable("userId") int userId,
                                         @PathVariable("schedulerId") int schedulerId){

        Scheduler scheduler = schedulerService.findById(schedulerId).orElse(null);
        if (scheduler == null){
            throw new RuntimeException("SCHEDULER_NOT_FOUND");
        }

        if (scheduler.getWebhook() != null){
            throw new RuntimeException("SCHEDULER_HAS_WEBHOOK");
        }

        Webhook webhook = webhookService.save(userId, scheduler);
//        String response = "{" + "\"url\":\"" + webhookService.buildUrl(webhook) + "\"}";

        WebhookResource resource = webhookService.toResource(webhook);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @DeleteMapping("/{webhookId}")
    public ResponseEntity<?> deleteWebhook(@PathVariable int webhookId){
        webhookService.deleteById(webhookId);
        return ResponseEntity.noContent().build();
    }
}
