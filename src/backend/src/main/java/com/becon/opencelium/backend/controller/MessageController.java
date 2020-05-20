package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.Message;
import com.becon.opencelium.backend.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.mysql.service.MessageServiceImpl;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.hateoas.Resources;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/message", produces = "application/hal+json", consumes = {"application/json"})
public class MessageController {

    @Autowired
    MessageServiceImpl messageService;

    @GetMapping("/all")
    ResponseEntity<?> getAll() throws Exception{
        List<Message> messageList = messageService.findAll();

        List<MessageResource> messageResources = messageList.stream()
                .map(message -> messageService.toResource(message))
                .collect(Collectors.toList());
        final Resources<MessageResource> resources = new Resources<>(messageResources);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    ResponseEntity<?> get(@PathVariable int id) throws Exception{
        Message message = messageService.findById(id).orElseThrow(()->new RuntimeException("MESSAGE_TEMPLATE_NOT_FOUND"));
        MessageResource messageResource = new MessageResource(message);
        final Resource<MessageResource> resource = new Resource<>(messageResource);
        return ResponseEntity.ok(resource);
    }

    @PostMapping
    ResponseEntity<?> createMessage(@RequestBody MessageResource messageResource) throws Exception{
        Message message = messageService.toEntity(messageResource);
        messageService.save(message);
        final Resource<MessageResource> resource = new Resource<>(messageService.toResource(message));
        return ResponseEntity.ok(resource);
    }
}
