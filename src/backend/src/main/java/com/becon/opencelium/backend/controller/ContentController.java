package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.notification.ContentResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Event Content", description = "Manages operations related to Event Content management")
@RequestMapping(value = "/api/content", produces = "application/json")
public class ContentController {

    @Autowired
    ContentServiceImpl contentService;

    @Operation(summary = "Retrieves List of Event Contents")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "All Event Contents have been successfully retrieved",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = ContentResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    ResponseEntity<List<ContentResource>> getAll() throws Exception{
        List<EventContent> eventContentList = contentService.findAll();

        List<ContentResource> contentResources = eventContentList.stream()
                .map(content -> contentService.toResource(content))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contentResources);
    }

    @Operation(summary = "Retrieves an Event Content by provided event content ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Event Content has been successfully retrieved",
                content = @Content(schema = @Schema(implementation = ContentResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    ResponseEntity<?> get(@PathVariable int id) throws Exception{
        EventContent eventContent = contentService.findById(id).orElseThrow(()->new RuntimeException("CONTENT_NOT_FOUND"));
        ContentResource contentResource = new ContentResource(eventContent);
        final EntityModel<ContentResource> resource = EntityModel.of(contentResource);
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Creates new Event Content in the system by accepting Event Content data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Event Content has been successfully created. The 'id' property will include newly created Event Content's ID.",
                content = @Content(schema = @Schema(implementation = ContentResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<?> createContent(@RequestBody ContentResource contentResource) throws Exception{
        EventContent eventContent = contentService.toEntity(contentResource);
        contentService.save(eventContent);
        final EntityModel<ContentResource> resource = EntityModel.of(contentService.toResource(eventContent));
        return ResponseEntity.ok(resource);
    }
}

