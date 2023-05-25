package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.search.SearchResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Search", description = "Manages operations related to search function")
@RequestMapping(value = "/api/search", produces = "application/hal+json", consumes = "application/json")
public class SearchController {

    @Autowired
    private ConnectorServiceImp connectorServiceImp;

    @Autowired
    private ConnectionServiceImp connectionServiceImp;

    @Autowired
    private SchedulerServiceImp schedulerServiceImp;

    @Operation(summary = "Collects connection, connector and scheduler by given title")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Success",
                content = @Content(schema = @Schema(implementation = ResultDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{title}")
    public ResponseEntity<?> searchByTitle(@PathVariable String title){

        List<SearchResource> results = new ArrayList<>();
        results.addAll(
                connectionServiceImp.findAllByNameContains(title).stream()
                        .filter(Objects::nonNull).map(SearchResource::new).toList()
        );
        results.addAll(
                connectorServiceImp.findAllByTitleContains(title).stream()
                        .filter(Objects::nonNull).map(SearchResource::new).toList()
        );
        results.addAll(
                schedulerServiceImp.findAllByTitleContains(title).stream()
                        .filter(Objects::nonNull).map(SearchResource::new).toList()
        );
        ResultDTO resultDTO = new ResultDTO(results);
        return ResponseEntity.ok().body(resultDTO);
    }
}
