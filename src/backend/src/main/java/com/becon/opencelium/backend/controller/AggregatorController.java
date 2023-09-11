package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import com.becon.opencelium.backend.database.mysql.service.DataAggregatorService;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/aggregator", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Aggregator", description = "Manages operation for collecting data from responses of executed methods")
public class AggregatorController {

    private final DataAggregatorService dataAggregatorService;

    @Autowired
    public AggregatorController(@Qualifier("DataAggregatorServiceImp") DataAggregatorService dataAggregatorService) {
        this.dataAggregatorService = dataAggregatorService;
    }


    @Operation(summary = "Retrieves a Data Aggregator by provided ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Data Aggregator has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = DataAggregatorDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<DataAggregatorDTO> get(@PathVariable Integer id) {
        DataAggregator dataAggregator = dataAggregatorService.getById(id);
        DataAggregatorDTO dataAggregatorDTO = dataAggregatorService.convertToDto(dataAggregator);
        return ResponseEntity.ok(dataAggregatorDTO);
    }

    @Operation(summary = "Creates new Data Aggregator in the system by accepting data in the request body")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Data Aggregator has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = DataAggregatorDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping
    public ResponseEntity<DataAggregatorDTO> save(@RequestBody DataAggregatorDTO dataAggregatorDTO){
        DataAggregator dataAggregator = dataAggregatorService.convertToEntity(dataAggregatorDTO);
        dataAggregatorService.save(dataAggregator);
        DataAggregatorDTO response = dataAggregatorService.convertToDto(dataAggregator);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Deletes a data aggregator by provided aggregator ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Data Aggregator has been successfully deleted.",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        dataAggregatorService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
