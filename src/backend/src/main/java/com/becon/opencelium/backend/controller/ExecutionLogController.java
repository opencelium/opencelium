package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.execution.log_managing.resource.LogMetaDataDto;
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

    @Operation(summary = "Returns a list of all top-level log metadata entries for a given execution")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogMetaDataDto.class))))
    })
    @GetMapping("/{executionId}")
    public ResponseEntity<List<LogMetaDataDto>> getMetaDataListVertically(
            @PathVariable String executionId,
            @RequestParam(name = "flowId", required = false) String flowchartId,
            @RequestParam(required = false) String indexPath,
            @RequestParam(required = false) String loopIndex // &loopIndex=1,2
    ) {
//        return ResponseEntity.ok(logMetaDataService.getParents(executionId, flowchartId, indexPath, loopIndex));
        return null;
    }

    @Operation(summary = "Returns children metadata of the specified element")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogMetaDataDto.class))))
    })
    @GetMapping("/{executionId}/child/list")
    public ResponseEntity<List<LogDataDTO>> getMetaDataListHorizontally(
            @PathVariable String executionId,
            @RequestParam(name = "flowId", required = false) String flowchartId,
            @RequestParam(required = false) String indexPath, // &indexPath=1_2_3_0
            @RequestParam(required = false) String loopIndex // &loopIndex=1,2
    ) {
        return ResponseEntity.ok(logMetaDataService.getChildren(executionId, flowchartId, indexPath, loopIndex));
    }
}