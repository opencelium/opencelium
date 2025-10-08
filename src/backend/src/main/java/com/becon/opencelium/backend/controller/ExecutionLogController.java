package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.commons.FileDescriptor;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.utility.LogFileUtility;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Execution", description = "Manages operations related to Execution")
@RequestMapping(value = "/execution")
public class ExecutionLogController {

    private final LogDataService logMetaDataService;
    private final SchedulerService schedulerService;

    public ExecutionLogController(LogDataService logMetaDataService, SchedulerService schedulerService) {
        this.logMetaDataService = logMetaDataService;
        this.schedulerService = schedulerService;
    }

    @Operation(summary = "Returns children elements' metadata of the specified element by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogDataDTO.class))))
    })
    @GetMapping("/log/element/{elementId}/children")
    public ResponseEntity<List<LogDataDTO>> getChildrenById(
            @PathVariable String elementId,
            @RequestParam(required = false, defaultValue = "0") String loopIndex
    ) {
        return ResponseEntity.ok(logMetaDataService.getChildrenById(elementId, loopIndex));
    }

    @Operation(summary = "Returns children elements metadata of the specified element by log file name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogDataDTO.class))))
    })
    @GetMapping("/logs/children")
    public ResponseEntity<List<LogDataDTO>> getChildrenByLogFile( @RequestParam String fileName ) {
        String elementId = LogFileUtility.extractExecutionId(fileName);
        // service resolves elementId from file, validates, then returns children
        return ResponseEntity.ok(logMetaDataService.getChildrenById(elementId, ""));
    }

    @Operation(summary = "Returns a single element with detailed data like refs, data, request and responses")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Success",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = LogDataDTO.class))))
    })
    @GetMapping("/log/element/{elementId}/details")
    public ResponseEntity<LogDataDTO> getDetailsById(@PathVariable String elementId) {
        return ResponseEntity.ok(logMetaDataService.getDetailsById(elementId));
    }

    @Operation(summary = "Retrieves a raw log file with given executionId")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved", content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE))
    })
    @GetMapping("/{executionId}/raw/log")
    public ResponseEntity<byte[]> getExecutionLogs(@PathVariable Long executionId) {

        FileDescriptor logFile = LogFileUtility.getLogFile(executionId);

        return ResponseEntity.ok()
                .headers(logFile.buildHeaders())
                .body(logFile.getData());
    }

    @Operation(summary = "Retrieves list of log names for connection by connectionId OR schedulerId AND/OR status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Log names for a connection has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/log-files")
    public ResponseEntity<ResultDTO<List<String>>> getLogFileNameList(
            @RequestParam(required = false, defaultValue = "-1") long connectionId,
            @RequestParam(required = false, defaultValue = "-1") int schedulerId,
            @RequestParam(required = false) String status
    ) {
        if (connectionId == -1) {
            connectionId = schedulerService.getConnectionIdById(schedulerId);
        }

        ResultDTO<List<String>> logFileNames = new ResultDTO<>(LogFileUtility.getLogFileNameList(connectionId, schedulerId, status));
        return ResponseEntity.ok(logFileNames);
    }

}