package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.execution.notification.enums.NotifyTool;
import com.becon.opencelium.backend.mysql.entity.EventContent;
import com.becon.opencelium.backend.mysql.entity.EventMessage;
import com.becon.opencelium.backend.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.mysql.service.MessageServiceImpl;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.notification.LanguageDTO;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@Tag(name = "Event Message", description = "Manages operations related to Event Messages management")
@RequestMapping(value = "/api/message", produces = MediaType.APPLICATION_JSON_VALUE)
public class MessageController {

    @Autowired
    private MessageServiceImpl messageService;

    @Autowired
    private ContentServiceImpl contentService;

    @Autowired
    private Environment env;

    @Operation(summary = "Retrieves all event messages from database")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "All Event Messages have been successfully retrieved",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = MessageResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<?> getAll() throws Exception{
        List<EventMessage> eventMessageList = messageService.findAll();

        List<MessageResource> messageResources = eventMessageList.stream()
                .map(message -> messageService.toResource(message))
                .collect(Collectors.toList());
        return ResponseEntity.ok(messageResources);
    }

    @Operation(summary = "Retrieves an event messages from database by provided Event Message ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Event Message has been successfully retrieved",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = MessageResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable int id) throws Exception{
        EventMessage eventMessage = messageService.findById(id).orElseThrow(()->new RuntimeException("MESSAGE_TEMPLATE_NOT_FOUND"));
        MessageResource messageResource = new MessageResource(eventMessage);
        final EntityModel<MessageResource> resource = EntityModel.of(messageResource);
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Creates an event message in the system by accepting event message data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Event Message has been successfully created",
                content = @Content(schema = @Schema(implementation = MessageResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createMessage(@RequestBody MessageResource messageResource) throws Exception{
        EventMessage eventMessage = messageService.toEntity(messageResource);
        messageService.save(eventMessage);

        List<EventContent> eventContents = eventMessage.getEventContents();
        eventContents.forEach(ec -> {
            LangEnum.valueOf(ec.getLanguage().toUpperCase(Locale.ROOT));
        });
        for (int i = 0; i < eventContents.size(); i++) {
            contentService.save(eventContents.get(i));
        }

        final EntityModel<MessageResource> resource = EntityModel.of(messageService.toResource(eventMessage));
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Deletes an event message in the system by providing ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Event Message has been successfully deleted",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable int id) throws Exception{
        messageService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes an event message in the system by providing ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "Event Message has been successfully deleted",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteMessageByIdIn(@RequestBody IdentifiersDTO<Integer> ids) throws Exception{
        ids.getIdentifiers().forEach(id -> messageService.deleteById(id));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Modifies an event message in the system by providing ID and by accepting event message data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Event Message has been successfully deleted",
                content = @Content(schema = @Schema(implementation = MessageResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateMessage(@PathVariable int id, @RequestBody MessageResource messageResource) throws Exception{
        messageResource.setTemplateId(id);
        EventMessage eventMessage = messageService.toEntity(messageResource);
        eventMessage.setId(id);
        messageService.save(eventMessage);

        List<EventContent> eventContents = eventMessage.getEventContents();
        for (int i = 0; i < eventContents.size(); i++) {
            contentService.save(eventContents.get(i));
        }

        final EntityModel<MessageResource> resource = EntityModel.of(messageService.toResource(eventMessage));
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Retrieves list of event messages from database by providing type of message")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Event Messages have been successfully retrieved by message type",
                    content = @Content(schema = @Schema(implementation = MessageResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all/{type}")
    public ResponseEntity<List<MessageResource>> getAllTemplatesByNotificationType(@PathVariable String type) throws Exception{
        List<EventMessage> eventMessageList = messageService.findAllByType(type);
        List<MessageResource> messageResources = eventMessageList.stream()
                .map(message -> messageService.toResource(message))
                .collect(Collectors.toList());
        return ResponseEntity.ok(messageResources);
    }

    @Operation(summary = "Retrieves a list of supported languages")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Languages has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = MessageResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/languages")
    public ResponseEntity<?> getSupportedLanguages() {
        List<LanguageDTO> languages = Stream.of(LangEnum.values())
                .map(e -> new LanguageDTO(e.getName(), e.getCode())).toList();
        Map<String, Object> body = new HashMap<>();
        body.put("languages", languages);
        return ResponseEntity.ok().body(body);
    }

    @Operation(summary = "Retrieves list of supported tools like email, teams, slack, etc...")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Returns array that contains string values like \"result\": [\"email\", \"slack\"]",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/tools/all")
    public ResponseEntity<?> getTools() throws Exception {
        List<String> notifyTools = Arrays.stream(NotifyTool.values()).map(Enum::toString).toList();
        ResultDTO<List<String>> resultDTO = new ResultDTO<>(notifyTools);
        return ResponseEntity.ok(resultDTO);
    }

//    @GetMapping("/tools/teams/team/all")
//    public ResponseEntity<?> getAllTeamsTeam() throws Exception {
//        TeamsDto teams = teamsService.getAllTeams();
//        return ResponseEntity.ok(teams);
//    }

//    @GetMapping("/tools/teams/team/{teamId}/channel/all")
//    public ResponseEntity<?> getAllTeamChannels(@PathVariable String teamId) throws Exception {
//        TeamsDto channels = teamsService.getAllChannels(teamId);
//        return ResponseEntity.ok(channels);
//    }

    @GetMapping("/tools/income_webhook")
    public ResponseEntity<?> getIncomeWebhook() throws Exception {
        String webhook = env.getProperty(YamlPropConst.INCOMING_WEBHOOK);
        ResultDTO<String> webhookDto = new ResultDTO<>(webhook);
        return ResponseEntity.ok(webhookDto);
    }
}
