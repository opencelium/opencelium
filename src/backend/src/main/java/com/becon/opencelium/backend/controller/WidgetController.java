package com.becon.opencelium.backend.controller;


import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.service.WidgetServiceImp;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Widget", description = "Manages operations related to Widget.")
@RequestMapping(value = "/api/widget", produces = MediaType.APPLICATION_JSON_VALUE)
public class WidgetController {

    @Autowired
    private WidgetServiceImp widgetServiceImp;

    @Operation(summary = "Creates a new widget in the system by accepting widget data in the request body")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Widget is successfully created. The 'widgetId' property will include newly created widget's 'id'",
                    content = @Content(schema = @Schema(implementation = WidgetResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody WidgetResource widgetResource){
        Widget widget = widgetServiceImp.toEntity(widgetResource);
        widgetServiceImp.save(widget);

        WidgetResource resource = widgetServiceImp.toResource(widget);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(resource.getWidgetId()).toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @Operation(summary = "Deletes a widget by 'id' ")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Widget is successfully deleted.",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id){
        widgetServiceImp.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Returns list of all widgets")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Widgets successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WidgetResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<?> viewAll() {
        List<Widget> widgets = widgetServiceImp.findAll();
        List<WidgetResource> resources = widgets.stream()
                .map(ws -> widgetServiceImp.toResource(ws))
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(resources);
    }

    @Operation(summary = "Returns a widget by provided widget id")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Widget successfully retrieved",
                    content = @Content(schema = @Schema(implementation = WidgetResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> view(@PathVariable("id") int id){
        Widget widget = widgetServiceImp.findById(id).orElseThrow(() -> new RuntimeException("Widget not found"));
        return ResponseEntity.ok().body(widget);
    }
}
