package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import com.becon.opencelium.backend.database.mysql.service.ArgumentService;
import com.becon.opencelium.backend.database.mysql.service.DataAggregatorService;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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

import java.util.List;

@RestController
@RequestMapping(value = "/api/aggregator", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Aggregator", description = "Manages operation for collecting data from responses of executed methods")
public class AggregatorController {

    private final DataAggregatorService dataAggregatorService;
    private final ArgumentService argumentService;

    @Autowired
    public AggregatorController(@Qualifier("dataAggregatorServiceImp") DataAggregatorService dataAggregatorService,
                                @Qualifier("ArgumentServiceImp") ArgumentService argumentService) {
        this.dataAggregatorService = dataAggregatorService;
        this.argumentService = argumentService;
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

    @Operation(summary = "Retrieves all Data Aggregator and related arguments")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Data Aggregator has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectorResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<DataAggregatorDTO>> getAll() {
        List<DataAggregator> daList = dataAggregatorService.findAll();
        List<DataAggregatorDTO> collection = daList.stream().map(dataAggregatorService::convertToDto).toList();
        return ResponseEntity.ok(collection);
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

        // added this field because after saving operation it didn't update id in dataAggregator object.
        dataAggregator = dataAggregatorService.getById(dataAggregator.getId());
        DataAggregatorDTO response = dataAggregatorService.convertToDto(dataAggregator);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Modifies Data Aggregator in the system by accepting data in the request body with ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Data Aggregator has been successfully updated",
                    content = @Content(schema = @Schema(implementation = DataAggregatorDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping
    public ResponseEntity<DataAggregatorDTO> update(@RequestBody DataAggregatorDTO dataAggregatorDTO){
        DataAggregator dataAggregator = dataAggregatorService.getById(dataAggregatorDTO.getId());
        dataAggregator.setActive(dataAggregatorDTO.isActive());
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

    @Operation(summary = "Checks whether a name of aggregator is unique or not.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Returns true if a name of aggregator is unique.",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/unique/{name}")
    public ResponseEntity<?> isNameUnique(@PathVariable String name) {
        Boolean isUnique = !dataAggregatorService.existsByName(name);
        ResultDTO<Boolean> resultDTO = new ResultDTO<>(isUnique);
        return ResponseEntity.ok(resultDTO);
    }

    @Operation(summary = "Checks whether an aggregator is active or not.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Returns true if a name of aggregator is unique.",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<?> put(@PathVariable Integer id, @RequestBody DataAggregatorDTO dataAggregatorDTO) {
        DataAggregator dataAggregator = dataAggregatorService.getById(id);
        dataAggregator.setActive(dataAggregatorDTO.isActive());
        dataAggregatorService.save(dataAggregator);
        ResultDTO<String> resultDTO = new ResultDTO<>("success");
        return ResponseEntity.ok(resultDTO);
    }


    // --------------------------------- ARGUMENTS ---------------------------------------
    @Operation(summary = "Deletes an argument by provided argument ID and breaks relation with execution")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Argument has been successfully deleted.",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/argument/{argId}")
    public ResponseEntity<?> deleteArgument(@PathVariable Integer argId) {
        argumentService.deleteById(argId);
        return ResponseEntity.noContent().build();
    }
}
