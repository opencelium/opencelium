package com.becon.opencelium.backend.controller;


import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.service.WidgetDataService;
import com.becon.opencelium.backend.database.mysql.service.WidgetService;
import com.becon.opencelium.backend.resource.application.ExecutionsTimelineDTO;
import com.becon.opencelium.backend.resource.application.TopWorkflowsDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Widget", description = "Manages operations related to Widget.")
@RequestMapping(value = "/widget", produces = MediaType.APPLICATION_JSON_VALUE)
public class WidgetController {

    private final WidgetService widgetService;
    private final WidgetDataService widgetDataService;

    public WidgetController(WidgetService widgetService, WidgetDataService widgetDataService) {
        this.widgetService = widgetService;
        this.widgetDataService = widgetDataService;
    }

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
        Widget widget = widgetService.toEntity(widgetResource);
        widgetService.save(widget);

        WidgetResource resource = widgetService.toResource(widget);
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
        widgetService.deleteById(id);
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
        List<Widget> widgets = widgetService.findAll();
        List<WidgetResource> resources = widgets.stream()
                .map(ws -> widgetService.toResource(ws))
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
        Widget widget = widgetService.findById(id).orElseThrow(() -> new RuntimeException("Widget not found"));
        return ResponseEntity.ok().body(widget);
    }

    @Operation(summary = "Returns executions and failures per day for the last 'days' days (inclusive of today)")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Timeline data successfully retrieved",
                    content = @Content(schema = @Schema(implementation = ExecutionsTimelineDTO.class))),
            @ApiResponse( responseCode = "400",
                    description = "'days' must be a positive number",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/executions-timeline")
    public ResponseEntity<ExecutionsTimelineDTO> getExecutionsTimeline(
            @RequestParam(name = "days", defaultValue = "7") int days) {
        if (days < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'days' must be a positive number");
        }
        return ResponseEntity.ok(widgetDataService.getExecutionsTimeline(days));
    }

    @Operation(summary = "Returns the top connections by all-time execution count, with their failure rate")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Top workflows successfully retrieved",
                    content = @Content(schema = @Schema(implementation = TopWorkflowsDTO.class))),
            @ApiResponse( responseCode = "400",
                    description = "'limit' must be a positive number",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/top-workflows")
    public ResponseEntity<TopWorkflowsDTO> getTopWorkflows(
            @RequestParam(name = "limit", defaultValue = "5") int limit) {
        if (limit < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'limit' must be a positive number");
        }
        return ResponseEntity.ok(widgetDataService.getTopWorkflows(limit));
    }
}
