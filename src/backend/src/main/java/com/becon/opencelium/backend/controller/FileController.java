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

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.FileDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.Xml;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Controller
@Tag(name = "File", description = "Manages operations related to File management")
@RequestMapping(value = "/storage")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    private final UserDetailServiceImpl userDetailService;
    private final UserServiceImpl userService;
    private final UserRoleServiceImpl userRoleService;
    private final TemplateServiceImp templateService;
    private final ConnectorServiceImp connectorService;
    private final InvokerServiceImp invokerServiceImp;
    private final InvokerSyncService invokerSyncService;
    private final UserStorageService storageService;
    private final Mapper<Connector, ConnectorResource> connectorMapper;
    private final EntityUpdater<Template> templateUpdater;
    private final OpenceliumProps ocProps;

    @Autowired
    public FileController(
            UserDetailServiceImpl userDetailService,
            UserServiceImpl userService,
            UserRoleServiceImpl userRoleService,
            TemplateServiceImp templateService,
            ConnectorServiceImp connectorService,
            InvokerServiceImp invokerServiceImp,
            InvokerSyncService invokerSyncService,
            UserStorageService storageService,
            Mapper<Connector, ConnectorResource> connectorMapper,
            EntityVersionManager versionManager,
            OpenceliumProps ocProps
    ) {
        this.userDetailService = userDetailService;
        this.userService = userService;
        this.userRoleService = userRoleService;
        this.templateService = templateService;
        this.connectorService = connectorService;
        this.invokerServiceImp = invokerServiceImp;
        this.invokerSyncService = invokerSyncService;
        this.storageService = storageService;
        this.connectorMapper = connectorMapper;
        this.templateUpdater = versionManager.getUpdater(Template.class);
        this.ocProps = ocProps;
    }

    @Operation(summary = "Uploads profile picture of a user by provided user email")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Profile picture has been successfully uploaded",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/profilePicture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> profilePictureUpload(@RequestParam("file") MultipartFile file,
                                                  @RequestParam("email") String email) {
        // Get extension
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());

        // Check image extension. It should be JPEG, PNG or JPG
        if (!FileNameUtils.isSupportedImageExtension(extension)){
            throw new StorageException("File should be jpg or png");
        }

        // Get user from database
        User user = userService.findByEmail(email).get();

        //Generate new file name
        String newFilename = UUID.randomUUID().toString() + "." + extension;

        // get user detail from user entity. Image are stored in user_detail table
        UserDetail userDetail = user.getUserDetail();

        // If profile has an old picture, delete the picture from storage
        if (userDetail.getProfilePicture() != null ){
            storageService.delete(userDetail.getProfilePicture());
        }

        // Set new picture name
        userDetail.setProfilePicture(newFilename);

        // Save in database the name of picture
        userDetailService.save(userDetail);

        // Save image in storage
        storageService.store(file, newFilename);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Uploads role's(group) icon by provided user role(group) ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Profile picture has been successfully uploaded",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/groupIcon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> groupPictureUpload(@RequestParam("file") MultipartFile file,
                                                @RequestParam("userGroupId") int userGroupId) {
        userRoleService.uploadIcon(userGroupId, file);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Uploads template json file")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Template has been successfully uploaded",
                content = @Content(schema = @Schema(implementation = FileDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/template", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        // Get extension
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());
        if (!"json".equalsIgnoreCase(extension)){
            throw new StorageException("File should be JSON");
        }

        try {
            String id;
            //Generate new file name
            ObjectMapper objectMapper = new ObjectMapper();
            Template template = objectMapper.readValue(file.getBytes(), Template.class);

            updateTemplate(template);

            if (template.getTemplateId() != null && templateService.existsById(template.getTemplateId())) {
                templateService.deleteById(template.getTemplateId());
                id = template.getTemplateId();
            } else {
                id = UUID.randomUUID().toString();
                template.setTemplateId(id);
            }
            // Save file in storage
            templateService.save(template);

            URI uri = getUri(id + ".json");
            FileDTO fileDTO = new FileDTO(id, uri.toString());
            return ResponseEntity.ok().body(fileDTO);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Uploads templates in zip file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Template has been successfully uploaded",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/template/zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadZip(@RequestParam("file") MultipartFile zip) {
        String extension = FileNameUtils.getExtension(zip.getOriginalFilename());

        if (!"zip".equalsIgnoreCase(extension)) {
            throw new RuntimeException("ZIP_FILE_REQUIRED");
        }

        List<FileDTO> files = new ArrayList<>();
        List<Template> templates = new ArrayList<>();

        try (
                InputStream inputStream = zip.getInputStream();
                ZipInputStream zis = new ZipInputStream(inputStream, StandardCharsets.UTF_8);
        ) {
            ZipEntry zipEntry;

            ObjectMapper objectMapper = new ObjectMapper();
            while ((zipEntry = zis.getNextEntry()) != null) {
                try {
                    if (zipEntry.isDirectory() || !zipEntry.getName().endsWith(".json")) {
                        continue;
                    }

                    //Generate new file name
                    String id = UUID.randomUUID().toString();
                    String jsonContent = new String(zis.readAllBytes(), StandardCharsets.UTF_8);

                    Template template = objectMapper.readValue(jsonContent, Template.class);
                    template.setTemplateId(id);

                    updateTemplate(template);
                    templates.add(template);
                } finally {
                    zis.closeEntry();
                }
            }

            templates.forEach(tmpl -> {
                templateService.save(tmpl);

                URI uri = getUri(tmpl.getTemplateId() + ".json");
                files.add(new FileDTO(tmpl.getTemplateId(), uri.toString()));
            });

            return ResponseEntity.ok().body(files);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Uploads invoker xml file")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Invoker has been successfully uploaded",
                content = @Content(schema = @Schema(implementation = FileDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/invoker", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadInvoker(@RequestParam("file") MultipartFile file) {
        String filename = file.getOriginalFilename();
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            Objects.requireNonNull(filename);
            if (filename.contains("..")) {
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            Objects.requireNonNull(extension);
            Xml xml = saveXmlFile(file.getInputStream(), filename);
            String name = xml.getValueByXPath("//invoker/name");
            FileDTO fileDTO = new FileDTO(name);

            // update invoker sync table to store latest files information
            invokerSyncService.updateSync(name);

            return ResponseEntity.ok(fileDTO);
        }
        catch (Exception e) {
            invokerServiceImp.delete(FileNameUtils.removeExtension(filename));
            throw new StorageException("Failed to store file " + filename, e);
        }
    }

    @Operation(summary = "Uploads zip file that contains invoker files")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Invoker has been successfully uploaded",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileDTO.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/invoker/zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadInvokerZip(@RequestParam("file") MultipartFile file) {
        String filename = file.getOriginalFilename();
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new StorageException("Failed to store empty file " + filename);
        }

        if (filename == null || filename.isBlank()) {
            throw new StorageException("Failed to store file with empty name");
        }

        if (!"zip".equalsIgnoreCase(extension)) {
            throw new RuntimeException("ZIP_FILE_REQUIRED");
        }

        List<FileDTO> fileDTOList = new ArrayList<>();

        try (
                InputStream inputStream = file.getInputStream();
                ZipInputStream zis = new ZipInputStream(inputStream, StandardCharsets.UTF_8)
        ) {
            ZipEntry zipEntry;

            while ((zipEntry = zis.getNextEntry()) != null) {
                try {
                    if (zipEntry.isDirectory() || !zipEntry.getName().endsWith(".xml")) {
                        continue;
                    }

                    Xml xml = saveXmlFile(zis, zipEntry.getName());
                    String name = xml.getValueByXPath("//invoker/name");

                    fileDTOList.add(new FileDTO(name));

                    // update invoker sync table to store latest files information
                    invokerSyncService.updateSync(name);
                } finally {
                    zis.closeEntry();
                }
            }

            return ResponseEntity.ok(fileDTOList);
        } catch (Exception e) {
            fileDTOList.forEach(f -> invokerServiceImp.delete(f.getId()));
            throw new StorageException("Failed to store file " + filename, e);
        }
    }

    private Xml saveXmlFile(InputStream inputStream, String filename) {
        try {
            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            InputStream copyIS = getInputStreamCopy(inputStream);
            Document doc = dBuilder.parse(copyIS);
            doc.setDocumentURI(PathConstant.INVOKER + filename);
            Xml xml = new Xml(doc, filename);
            xml.save(); // TODO: add to invokerServiceImpl
            invokerServiceImp.save(doc);
            copyIS.close();
            return xml;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }

    private InputStream getInputStreamCopy(InputStream originInputStream) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        byte[] buffer = new byte[1024];
        int bytesRead;
        try {
            while ((bytesRead = originInputStream.read(buffer)) > -1 ) {
                baos.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return new ByteArrayInputStream(baos.toByteArray());
    }


    /**
     * @deprecated Connector icon management has moved to the connector resource itself.
     * Use {@code POST /connector/{id}/icon} instead. Kept temporarily so the frontend can
     * migrate without a hard break; delegates to {@link ConnectorServiceImp#storeIcon}.
     */
    @Deprecated
    @Operation(summary = "Uploads a connector icon. Deprecated: use POST /connector/{id}/icon instead.",
            deprecated = true)
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Connector has been successfully uploaded",
                content = @Content(schema = @Schema(implementation = ConnectorResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/connector", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> connectorUpload(@RequestParam("file") MultipartFile file,
                                             @RequestParam("connectorId") int connectorId) {
        Connector connector = connectorService.storeIcon(connectorId, file);
        return ResponseEntity.ok().body(connectorMapper.toDTO(connector));
    }

    @GetMapping("/files/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

        Resource file = storageService.loadAsResource(filename);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getFilename() + "\"").body(file);
    }

    private URI getUri(String name) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = attributes.getRequest();
        UriComponents uriComponents = UriComponentsBuilder.newInstance()
                .scheme(request.getScheme())
                .host(request.getServerName())
                .port(request.getServerPort())
                .path("/api/template/file/" + name)
                .build();

        return uriComponents.toUri();
    }

    private void updateTemplate(Template template){
        try {
            templateUpdater.updateToCurrentVersion(template)
                    .ifUpdated(temp -> {
                        log.info("Template[id={}, name={}] is successfully updated to {} version", template.getTemplateId(), template.getName(), ocProps.getVersion());
                    });
            template.setVersion(ocProps.getVersion());
        } catch (Exception e) {
            log.error("Failed to update Template[id={}, name={}]", template.getTemplateId(), template.getName(), e);
            throw new RuntimeException("INVALID_TEMPLATE");
        }
    }
}
