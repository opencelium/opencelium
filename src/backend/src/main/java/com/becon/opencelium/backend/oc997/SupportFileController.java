package com.becon.opencelium.backend.oc997;

import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.List;

@RestController
@Tag(name = "Support files for Connections", description = "Manages connection execution related support files")
@RequestMapping(value = "/api/connection/support-file")
public class SupportFileController {

    @Autowired
    private SupportFileService fileService;

    @Operation(summary = "Retrieves all support file names")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Support files names have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ComponentResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/list")
    public ResponseEntity<List<ConnectionSupportFiles>> supportFileList() {
        return ResponseEntity.ok(fileService.supportFileList());
    }

    @Operation(summary = "Retrieves support file names for a connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Support files names have been successfully retrieved for a connection",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ComponentResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{connectionId}/list")
    public ResponseEntity<ConnectionSupportFiles> connectionSupportFileList(@PathVariable Long connectionId) {
        return ResponseEntity.ok(fileService.connectionSupportFileList(connectionId));
    }

    @Operation(summary = "Retrieves support file for a connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Support file have been successfully retrieved for a connection",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ComponentResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{connectionId}/{zipFileName}")
    public ResponseEntity<Resource> downloadSupportFile(@PathVariable Long connectionId, @PathVariable String zipFileName) {
        File zip = fileService.getSupportFile(connectionId, zipFileName);
        Resource resource = new FileSystemResource(zip);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + zip.getName());
        headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }

    @Operation(summary = "Retrieves support file for successful execution")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Support file  for successful execution have been successfully retrieved.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ComponentResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{connectionId}")
    public ResponseEntity<Resource> downloadSupportFile(@PathVariable Long connectionId) {
        File zip = fileService.getSupportFile(connectionId);
        Resource resource = new FileSystemResource(zip);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + zip.getName());
        headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }
}
