package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Execution", description = "Manages operations related to Execution")
@RequestMapping(value = "/execution/log")
public class ExecutionLogController {

    private final LogDataService logMetaDataService;

    public ExecutionLogController(LogDataService logMetaDataService) {
        this.logMetaDataService = logMetaDataService;
    }

    @Operation(summary = "Returns children elements' metadata of the specified element by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogDataDTO.class))))
    })
    @GetMapping("/element/{elementId}/children")
    public ResponseEntity<List<LogDataDTO>> getChildrenById(
            @PathVariable String elementId,
            @RequestParam(required = false, defaultValue = "") String loopIndex
    ) {
        return ResponseEntity.ok(logMetaDataService.getChildrenById(elementId, loopIndex));
    }

    @Operation(summary = "Returns a single element with detailed data like refs, data, request and responses")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogDataDTO.class))))
    })
    @GetMapping("/element/{elementId}/details")
    public ResponseEntity<LogDataDTO> getDetailsById(@PathVariable String elementId) {
        return ResponseEntity.ok(logMetaDataService.getDetailsById(elementId));
    }
}