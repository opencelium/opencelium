package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.EventContent;
import com.becon.opencelium.backend.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.resource.notification.ContentResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/content", produces = "application/hal+json", consumes = {"application/json"})
public class ContentController {

    @Autowired
    ContentServiceImpl contentService;

    @GetMapping("/all")
    ResponseEntity<?> getAll() throws Exception{
        List<EventContent> eventContentList = contentService.findAll();

        List<ContentResource> contentResources = eventContentList.stream()
                .map(content -> contentService.toResource(content))
                .collect(Collectors.toList());
        final CollectionModel<ContentResource> resources = CollectionModel.of(contentResources);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    ResponseEntity<?> get(@PathVariable int id) throws Exception{
        EventContent eventContent = contentService.findById(id).orElseThrow(()->new RuntimeException("CONTENT_NOT_FOUND"));
        ContentResource contentResource = new ContentResource(eventContent);
        final EntityModel<ContentResource> resource = EntityModel.of(contentResource);
        return ResponseEntity.ok(resource);
    }

    @PostMapping
    ResponseEntity<?> createContent(@RequestBody ContentResource contentResource) throws Exception{
        EventContent eventContent = contentService.toEntity(contentResource);
        contentService.save(eventContent);
        final EntityModel<ContentResource> resource = EntityModel.of(contentService.toResource(eventContent));
        return ResponseEntity.ok(resource);
    }
}

