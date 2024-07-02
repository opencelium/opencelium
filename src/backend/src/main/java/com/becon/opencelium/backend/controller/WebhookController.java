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

import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.entity.Webhook;
import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.database.mysql.service.WebhookServiceImp;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.execution.QueryParamDataType;
import com.becon.opencelium.backend.resource.webhook.WebhookResource;
import com.becon.opencelium.backend.resource.webhook.WebhookTokenResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Arrays;
import java.util.Map;

@RestController
@Tag(name = "Webhook", description = "Manages operations related to webhook management")
@RequestMapping(value = "/api/webhook")
public class WebhookController {

    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private WebhookServiceImp webhookService;

    @Operation(summary = "Accepts a webhook and executes the associated connection. Additional params are sent in url query params")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Webhook has been successfully executed"),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
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

    @Operation(summary = "Accepts a webhook and executes the associated connection. Additional params are sent as a json in body")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Webhook has been successfully executed",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("execute/{token}")
    public ResponseEntity<?> executeConn(@PathVariable("token") String token, @RequestBody Map<String, Object> queryParam) {
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

    @Operation(summary = "Checks if the remote server is up and running.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Server is up and running",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/health")
    public ResponseEntity<?> checkHealth(){
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Generates webhook by given user and scheduler")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Webhook has been successfully executed",
                    content = @Content(schema = @Schema(implementation = WebhookResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(value = "/url/{userId}/{schedulerId}")
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
        WebhookResource resource = webhookService.toResource(webhook);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @Operation(summary = "Returns supported data types for query parameters")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Data types successfully returned",
                    content = @Content(schema = @Schema(implementation = WebhookResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(value = "/supported/types")
    public ResponseEntity<?> generateSupportedDataTypes(){
        return ResponseEntity.ok(QueryParamDataType.getTypes());
    }

    @Operation(summary = "Removes webhook")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Webhook has been successfully deleted",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{webhookId}")
    public ResponseEntity<?> deleteWebhook(@PathVariable int webhookId){
        webhookService.deleteById(webhookId);
        return ResponseEntity.noContent().build();
    }
}
