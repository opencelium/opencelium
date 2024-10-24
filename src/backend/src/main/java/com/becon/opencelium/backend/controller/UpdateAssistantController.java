/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.application.assistant.AssistantServiceImp;
import com.becon.opencelium.backend.application.assistant.UpdatePackageServiceImp;
import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.becon.opencelium.backend.resource.application.MigrateDataResource;
import com.becon.opencelium.backend.resource.update_assistant.InstallationDTO;
import com.becon.opencelium.backend.resource.update_assistant.Neo4jConfigResource;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.resource.update_assistant.VersionDTO;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.zaxxer.hikari.pool.HikariPool;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.DirectFieldAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Update Assistant", description = "Manages version control operations.")
@RequestMapping(value = "/api/assistant", produces = MediaType.APPLICATION_JSON_VALUE)
public class UpdateAssistantController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AssistantServiceImp assistantServiceImp;

    @Autowired
    private UpdatePackageServiceImp packageServiceImp;

    @Autowired
    private TemplateServiceImp templateServiceImp;

    @Autowired
    private UpdatePackageServiceImp updatePackageServiceImp;

    @GetMapping("/all")
    public List<String> getAll() {
        DataSource dataSource = jdbcTemplate.getDataSource();
        assert dataSource != null;
        HikariPool hikariPool = (HikariPool) new DirectFieldAccessor(dataSource).getPropertyValue("pool");
        assert hikariPool != null;
        System.out.println(hikariPool.toString());
        return null;
    }

    @Operation(summary = "Checks if OpenCelium is up and running.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "OpenCelium is up and running"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/oc/test")
    public ResponseEntity<?> ocTest() {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Returns current version of OpenCelium")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "The version has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = VersionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/oc/version")
    public ResponseEntity<?> ocCurrentVersion() {
        String version = assistantServiceImp.getCurrentVersion();
        VersionDTO versionDTO = new VersionDTO(version);
        return ResponseEntity.ok().body(versionDTO);
    }

    @GetMapping("/oc/requirements")
    public ResponseEntity<?> getSystemRequirement() {
        String version = assistantServiceImp.getCurrentVersion();
        String result = "{" + "\"version\": \"" + version + "\"}";
        return ResponseEntity.ok(result);
    }

    @GetMapping("/oc/installation")
    public ResponseEntity<?> getInstallation() {
        InstallationDTO installationDTO = assistantServiceImp.getInstallation();
        return ResponseEntity.ok(installationDTO);
    }

    @Operation(summary = "Returns current versions of tools that are used in OpenCelium")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Overview of tools has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = SystemOverviewResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/oc/system/overview")
    public ResponseEntity<?> getSystemOverview() {
        SystemOverview systemOverview = assistantServiceImp.getSystemOverview();
        SystemOverviewResource resource = assistantServiceImp.toResource(systemOverview);
        return ResponseEntity.ok().body(resource);
    }

    @Operation(summary = "Returns list of current offline versions of tools that are used in OpenCelium")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "List of offline versions has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AvailableUpdateResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/oc/offline/version/all")
    public ResponseEntity<?> getOfflineVersion() {
        List<AvailableUpdate> offVersions = packageServiceImp.getOffVersions();
        List<AvailableUpdateResource> packageResource = offVersions.stream()
                .map(p -> packageServiceImp.toResource(p)).collect(Collectors.toList());
        return ResponseEntity.ok(packageResource);
    }

    @Operation(summary = "Returns current versions of tools that are used in OpenCelium from Service Portal")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns response from Service Portal in json format"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(value = "/oc/online/version/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getOnlineVersion() {
        List<AvailableUpdate> onVersions_json = packageServiceImp.getOnVersions();
        List<AvailableUpdateResource> versions = onVersions_json.stream()
                .map(t -> updatePackageServiceImp.toResource(t)).toList();
        return ResponseEntity.ok(versions);
    }

    @Operation(summary = "Downloads zip version of OC from remote repository")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "ZIP file was successfully downloaded"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(value = "/oc/online/version/{version}/download", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> downloadVersion(@PathVariable String version) {
        try {
            packageServiceImp.downloadPackage(version);
            AvailableUpdate availableUpdate = updatePackageServiceImp.getAvailableUpdate(version);
            AvailableUpdateResource availableUpdateResource = updatePackageServiceImp.toResource(availableUpdate);
            return ResponseEntity.ok(availableUpdateResource);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Validates weather an oc_service.sh file exists or not")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns response from Service Portal in json format",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/oc/restart/file/exists")
    public ResponseEntity<?> fileExists() {
        Path currentRelativePath = Paths.get("").toAbsolutePath().getParent().getParent();
        String ocScriptPath = currentRelativePath.toString() + "/scripts/oc_service.sh";
        File file = new File(ocScriptPath);
        ErrorResource errorResource = new ErrorResource();
        errorResource.setMessage("EXISTS");
        errorResource.setStatus(HttpStatus.OK);
        errorResource.setPath(ocScriptPath);
        if (!file.exists()) {
            errorResource.setMessage("NOT_EXISTS");
            errorResource.setStatus(HttpStatus.OK);
            errorResource.setPath(ocScriptPath);
            return ResponseEntity.ok(errorResource);
        }
        return ResponseEntity.ok(errorResource);
    }
// ---------------------------------------------------------------------------------------------
//    @GetMapping("/verify/repo/credentials")
//    public ResponseEntity<?> verifyRepoCredentials() {
//        if (assistantServiceImp.repoVerification()) {
//            return ResponseEntity.ok().build();
//        } else {
//            return ResponseEntity.noContent().build();
//        }
//    }

//    @GetMapping("/subscription/repo/update/check")
//    public ResponseEntity<?> subsRepoHasChanges() {
//        try {
//            if (assistantServiceImp.repoHasChanges()) {
//                return ResponseEntity.ok().build();
//            } else {
//                return ResponseEntity.noContent().build();
//            }
//        } catch (Exception e) {
//            throw new RuntimeException(e);
//        }
//    }

    //    @GetMapping("/subscription/repo/diff/files")
//    public ResponseEntity<?> getDiffFiles() {
//        try {
//            DiffFilesResource diffFilesName = new DiffFilesResource(assistantServiceImp.getChangedFileName());
//            return ResponseEntity.ok(diffFilesName);
//        } catch (Exception e) {
//            throw new RuntimeException(e);
//        }
//    }
//    @GetMapping("/subscription/repo/updateAll")
//    public ResponseEntity<?> subsRepoUpdate() {
//        try {
//            assistantServiceImp.updateSubsFiles();
//        } catch (Exception e) {
//            throw new RuntimeException(e);
//        }
//        return ResponseEntity.ok().build();
//    }
// ---------------------------------------------------------------------------------------------
    @GetMapping("/oc/template")
    public ResponseEntity<?> getAssistantTemplateFiles() {
        String path = PathConstant.TEMPLATE;
        List<Template> templates = templateServiceImp.findAllByPath(path);
        List<TemplateResource> templateResources = templates.stream()
                .map(t -> templateServiceImp.toResource(t))
                .collect(Collectors.toList());
        return ResponseEntity.ok(templateResources);
    }

    @Operation(summary = "Migrates invokers, templates and connections to a selected version and replacing all files from zip file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Migration has been done successfully"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/oc/migrate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> migrate(@RequestBody MigrateDataResource migrateDataResource) {

        // do backup
//        assistantServiceImp.runScript();
        try {
            //////test commit
            assistantServiceImp.updateOff(migrateDataResource.getVersion());

            //TODO: template update and migration
            //TODO: invoker update and migration
            //TODO: connection update and migration

            // User will manually from terminal
//            assistantServiceImp.buildAndRestart();

        } catch (Exception e) {
            throw new RuntimeException(e);
//            assistantServiceImp.restore();
        }

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Uploads zip file that contains OpenCelium versions")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Migration has been done successfully",
                    content = @Content(schema = @Schema(implementation = AvailableUpdateResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/zipfile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> assistantUploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String zippedAppVersion = assistantServiceImp.getVersion(file.getInputStream());
            Path target = Paths.get(PathConstant.ASSISTANT + "versions/" + zippedAppVersion);
            assistantServiceImp.uploadZipFile(file, target);
            AvailableUpdate availableUpdate = updatePackageServiceImp.getAvailableUpdate(zippedAppVersion);
            AvailableUpdateResource availableUpdateResource = updatePackageServiceImp.toResource(availableUpdate);
            return ResponseEntity.ok(availableUpdateResource);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Deletes zip file that contains OpenCelium versions")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Deletion has been done successfully",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(value = "/zipfile/{filename}")
    public ResponseEntity<?> assistantDeleteFile(@PathVariable String filename) {

        Path zipPath = Paths.get(PathConstant.ASSISTANT + PathConstant.VERSIONS + filename);
        assistantServiceImp.deleteZipFile(zipPath);
        return ResponseEntity.noContent().build();
    }

    private boolean checkJsonExtension(String extension) {
        if (!(extension.equals("json") || extension.equals("JSON"))) {
            return false;
        }
        return true;
    }

    @Operation(summary = "Returns changelogs of specified package")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Changelog has been retrieved successfully",
                    content = @Content(schema = @Schema(implementation = org.springframework.core.io.Resource.class)),
                    headers = {
                            @Header(name = "Content-Disposition", description = "Default value - attachment; filename=\"{filename}\"")
                    }),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/changelog/file/{packageName}")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String packageName) {

        try {
            String path = PathConstant.ASSISTANT + PathConstant.VERSIONS + packageName + "/";
            Path rootLocation = Paths.get(path);
            Path filePath = rootLocation.resolve("CHANGELOG");
            org.springframework.core.io.Resource file = new UrlResource(filePath.toUri());
            if (!file.exists() || !file.isReadable()) {
                throw new StorageFileNotFoundException("Could not read file: " + packageName + "/CHANGELOG");
            }
            return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + file.getFilename() + "\"").body(file);
        } catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + packageName + "/CHANGELOG", e);
        }
    }

    @PostMapping("/db/migrate")
    public ResponseEntity<?> dbMigrate(@RequestBody Neo4jConfigResource neo4jConfig) {
        assistantServiceImp.doMigrate(neo4jConfig);
        return ResponseEntity.ok().build();
    }
}
