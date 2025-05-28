package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.database.mongodb.service.LogMetaDataService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.log_managing.resource.MetaDataListDto;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Execution", description = "Manages operations related to Execution")
@RequestMapping(value = "/execution")
public class ExecutionController {

    private static final String LOOP_INDEX_DELIMITER = ",";
    private final LogMetaDataService logMetaDataService;

    public ExecutionController(LogMetaDataService logMetaDataService) {
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
        return ResponseEntity.ok(logMetaDataService.getMetaDataList(executionId));
    }

    @Operation(summary = "Returns child metadata elements of the specified indexPath")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MetaDataListDto.class))))
    })
    @GetMapping("/{executionId}/connector/{connectorId}/element/{indexPath}/child")
    public ResponseEntity<List<MetaDataListDto>> getMetaDataList(
            @PathVariable String executionId,
            @PathVariable String connectorId,
            @PathVariable String indexPath,
            @RequestParam(name = "loopIndex", required = false, defaultValue = "") String loopIndex
    ) {
        checkLoopIndex(loopIndex);

        return ResponseEntity.ok(
                logMetaDataService.getMetaDataList(executionId, connectorId, indexPath, loopIndex)
        );
    }

    private void checkLoopIndex(String loopIndex) {
        if (!StringUtils.isBlank(loopIndex)) {
            try {
                for (String index : loopIndex.split(LOOP_INDEX_DELIMITER)) {
                    Integer.parseInt(index);
                }
            } catch (Exception e) {
                throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.INVALID_LOOP_INDEX.formatted(loopIndex));
            }
        }
    }
}