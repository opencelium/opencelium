package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.execution.log_managing.resource.MetaDataListDto;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Execution", description = "Manages operations related to Execution")
@RequestMapping(value = "/execution/log")
public class ExecutionLogController {

    private final LogDataService logMetaDataService;

    public ExecutionLogController(LogDataService logMetaDataService) {
        this.logMetaDataService = logMetaDataService;
    }

    @Operation(summary = "Returns a list of all root-level log metadata entries for a given execution")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MetaDataListDto.class))))
    })
    @GetMapping("/{executionId}/meta/list")
    public ResponseEntity<List<MetaDataListDto>> getMetaDataList(@PathVariable String executionId) {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Returns children metadata of the specified element")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MetaDataListDto.class))))
    })
    // change connectorId to a flowId
    @GetMapping("/{executionId}/flowchart/{flowId}")
    public ResponseEntity<List<MetaDataListDto>> getMetaDataList(
            // /{executionId}?flowchart={flowId}?indexPath={indexPath}&loopIndex=1,2
            @PathVariable String executionId,
            @PathVariable String flowId,
            @RequestParam String indexPath,
            @RequestParam("loopIndex") List<String> loopIndexes // if inside a loop.
    ) {
//        // 1. Fetch raw metadata entities
//        List<LogData> rawList = logMetaDataService.findChildren(
//                executionId, flowId, indexPath, loopIndexes
//        );
//
//        // 2. Map to DTO
//        List<MetaDataListDto> dtos = rawList.stream()
//                .map(this::toMetaDataListDto)
//                .collect(Collectors.toList());

//        return ResponseEntity.ok(dtos);
        return ResponseEntity.ok().build();
    }
}