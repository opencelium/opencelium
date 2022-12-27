package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.EventContent;
import com.becon.opencelium.backend.mysql.entity.EventMessage;
import com.becon.opencelium.backend.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.mysql.service.MessageServiceImpl;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/message", produces = "application/hal+json", consumes = {"application/json"})
public class MessageController {

    @Autowired
    MessageServiceImpl messageService;

    @Autowired
    ContentServiceImpl contentService;

    @GetMapping("/all")
    public ResponseEntity<?> getAll() throws Exception{
        List<EventMessage> eventMessageList = messageService.findAll();

        List<MessageResource> messageResources = eventMessageList.stream()
                .map(message -> messageService.toResource(message))
                .collect(Collectors.toList());
        final CollectionModel<MessageResource> resources = CollectionModel.of(messageResources);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable int id) throws Exception{
        EventMessage eventMessage = messageService.findById(id).orElseThrow(()->new RuntimeException("MESSAGE_TEMPLATE_NOT_FOUND"));
        MessageResource messageResource = new MessageResource(eventMessage);
        final EntityModel<MessageResource> resource = EntityModel.of(messageResource);
        return ResponseEntity.ok(resource);
    }

    @PostMapping
    public ResponseEntity<?> createMessage(@RequestBody MessageResource messageResource) throws Exception{
        EventMessage eventMessage = messageService.toEntity(messageResource);
        messageService.save(eventMessage);

        List<EventContent> eventContents = eventMessage.getEventContents();
        for (int i = 0; i < eventContents.size(); i++) {
            contentService.save(eventContents.get(i));
        }

        final EntityModel<MessageResource> resource = EntityModel.of(messageService.toResource(eventMessage));
        return ResponseEntity.ok(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable int id) throws Exception{
        messageService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> deleteMessageByIdIn(@RequestBody List<Integer> ids) throws Exception{
        ids.forEach(id -> messageService.deleteById(id));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
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

    @GetMapping("/all/{type}")
    public ResponseEntity<?> getAllTemplatesByNotificationType(@PathVariable String type) throws Exception{
        List<EventMessage> eventMessageList = messageService.findAllByType(type);
        List<MessageResource> messageResources = eventMessageList.stream()
                .map(message -> messageService.toResource(message))
                .collect(Collectors.toList());
        final CollectionModel<MessageResource> resources = CollectionModel.of(messageResources);
        return ResponseEntity.ok(resources);
    }

}
