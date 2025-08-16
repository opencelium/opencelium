package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.service.OnlineSyncHistoryService;
import com.becon.opencelium.backend.resource.OnlineSyncHistoryDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@Tag(name = "Online Synchronization History with Service Portal", description = "Manages online sync history related records")
@RequestMapping(value = "/sync-history")
public class OnlineSyncHistoryController {

    private final OnlineSyncHistoryService onlineSyncHistoryService;

    public OnlineSyncHistoryController(OnlineSyncHistoryService onlineSyncHistoryService) {
        this.onlineSyncHistoryService = onlineSyncHistoryService;
    }

    @Operation(summary = "Retrieves all online sync history records")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Online sync history records have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = OnlineSyncHistoryDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/list")
    public ResponseEntity<List<OnlineSyncHistoryDTO>> findAll(
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime
    ) {
        return ResponseEntity.ok(onlineSyncHistoryService.findAll(user, service, startTime, endTime));
    }

    @Operation(summary = "Retrieves online sync history records as a csv file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Online sync history records have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = Resource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportCSV(
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime
    ) {
        List<OnlineSyncHistoryDTO> history = onlineSyncHistoryService.findAll(user, service, startTime, endTime);

        StringBuilder csv = new StringBuilder();

        csv.append("User,Service,Details,Timestamp\n");
        for (OnlineSyncHistoryDTO h : history) {
            csv
                    .append(h.getUser()).append(",")
                    .append(h.getService()).append(",")
                    .append(escapeCsv(h.getDetails())).append(",")
                    .append(h.getTimestamp()).append("\n");
        }

        byte[] csvBytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sync-history.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }


    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }

        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }

        return escaped;
    }
}
