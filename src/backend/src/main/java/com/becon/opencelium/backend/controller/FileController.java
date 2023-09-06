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
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.FileDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Controller
@Tag(name = "File", description = "Manages operations related to File management")
@RequestMapping(value = "/api/storage")
public class FileController {

    @Autowired
    private UserDetailServiceImpl userDetailService;

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private UserRoleServiceImpl userRoleService;

    @Autowired
    private TemplateServiceImp templateService;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private AssistantServiceImp assistantServiceImp;

    @Autowired
    private UpdatePackageServiceImp updatePackageServiceImp;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

//    @Autowired
//    private InvokerContainer invokerContainer;

    private final UserStorageService storageService;

    @Autowired
    public FileController(UserStorageService storageService) {
        this.storageService = storageService;
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
        if (!checkImageExtension(extension)){
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

        // Get extension of file
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());
        Objects.requireNonNull(extension);
        // Check image extension. It should be JPEG, PNG or JPG
        if (!checkImageExtension(extension)){
            throw new StorageException("File should be jpg or png");
        }

        // Get userGroup data from database
        UserRole userRole = userRoleService.getOne(userGroupId);

        //Generate new file name
        String newFilename = UUID.randomUUID().toString() + "." + extension;

        // If user group has an old image, delete the picture from files
        if (userRole.getIcon() != null){
            storageService.delete(userRole.getIcon());
        }

        // Set new image name
        userRole.setIcon(newFilename);

        // Save in database the name of image
        userRoleService.save(userRole);

        // Save image in storage
        storageService.store(file, newFilename);

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
        if (extension == null) {
            throw new RuntimeException("Extension not found");
        }
        try {
            if (!checkJsonExtension(extension)){
                throw new StorageException("File should be JSON");
            }
            //Generate new file name
            String id = UUID.randomUUID().toString();
            ObjectMapper objectMapper = new ObjectMapper();
            Template template = objectMapper.readValue(file.getBytes(), Template.class);
            template.setTemplateId(id);
            // Save file in storage
            templateService.save(template);

            URI uri = getUri(id + ".json");
            FileDTO fileDTO = new FileDTO(id, uri.toString());
            return ResponseEntity.ok().body(fileDTO);
        } catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Uploads templates in zip file")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Template has been successfully uploaded",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = FileDTO.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/template/zip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadZip(@RequestParam("file") MultipartFile zip) {
        // Get extension
        String extension = FileNameUtils.getExtension(zip.getOriginalFilename());
        if (extension == null) {
            throw new RuntimeException("Extension not found");
        }

        List<FileDTO> files = new ArrayList<>();
        try {
            if (extension.equals("zip")) {
                InputStream inputStream = zip.getInputStream();
                ZipInputStream zis = new ZipInputStream(inputStream);
                ObjectMapper objectMapper = new ObjectMapper();
                ZipEntry zipEntry;
                while ((zipEntry = zis.getNextEntry()) != null) {
                    if(zipEntry.isDirectory() || !zipEntry.getName().endsWith(".json")) {
                        continue;
                    }
                    //Generate new file name
                    String id = UUID.randomUUID().toString();
                    String jsonContent = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    Template template = objectMapper.readValue(jsonContent, Template.class);
                    template.setTemplateId(id);
                    // Save file in storage
                    templateService.save(template);
                    URI uri = getUri(id + ".json");
                    FileDTO fileDTO = new FileDTO(id, uri.toString());
                    files.add(fileDTO);
                }
                zis.close();
            } else {
                throw new RuntimeException("Zip file is required");
            }
        } catch (Exception e){
            throw new RuntimeException(e);
        }

        return ResponseEntity.ok().body(files);
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
        List<FileDTO> fileDTOList = new ArrayList<>();
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            Objects.requireNonNull(filename);
            if (filename.contains("..")) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            Objects.requireNonNull(extension);
            if (extension.equals("zip")) {
                InputStream inputStream = file.getInputStream();
                ZipInputStream zis = new ZipInputStream(inputStream);
                ZipEntry zipEntry;
                while ((zipEntry = zis.getNextEntry()) != null) {
                    if(zipEntry.isDirectory() || !zipEntry.getName().endsWith(".xml")) {
                        continue;
                    }
                    Xml xml = saveXmlFile(zis, zipEntry.getName());
                    String name = xml.getValueByXPath("//invoker/name");
                    FileDTO fileDTO = new FileDTO(name);
                    fileDTOList.add(fileDTO);
                }
                zis.close();
            } else {
                throw new RuntimeException("ZIP_FILE_REQUIRED");
            }
        } catch (Exception e) {
            fileDTOList.forEach(f -> {
                invokerServiceImp.delete(f.getId());
            });
            throw new StorageException("Failed to store file " + filename, e);
        }
        return ResponseEntity.ok(fileDTOList);
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


    @Operation(summary = "Uploads connector json file")
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

        Connector connector = connectorService.findById(connectorId).orElseThrow(() ->
                new RuntimeException("CONNECTOR_NOT_FOUND"));
        // Get extension
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());
        Objects.requireNonNull(extension);
        if (!checkImageExtension(extension)){
            throw new StorageException("File should be jpg or png");
        }

        try {
            //Generate new file name
            String newFilename = UUID.randomUUID().toString() + "." + extension;
            connector.setIcon(newFilename);
            // Save file in storage
            storageService.store(file, newFilename);
            connectorService.save(connector);
            ConnectorResource resource = connectorService.toResource(connector);
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    private boolean checkJsonExtension(String extension){
        if (!(extension.equals("json") || extension.equals("JSON"))){
            return false;
        }
        return true;
    }

    @GetMapping("/files/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

        Resource file = storageService.loadAsResource(filename);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getFilename() + "\"").body(file);
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<?> handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }

    private boolean checkImageExtension(String extension){
        if (!(extension.equals("jpeg") || extension.equals("png")
                || extension.equals("jpg"))){
            return false;
        }
        return true;
    }

    private static String readJsonContent(InputStream inputStream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            StringBuilder content = new StringBuilder();

            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line);
            }

            return content.toString();
        }
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

    private List<Document> getAllInvokers(){
        Path location = Paths.get(PathConstant.INVOKER);
        try {
            Stream<Path> allInvokers = Files.walk(location, 1)
                    .filter(path -> !path.equals(location))
                    .map(location::relativize);

            return allInvokers.map(p -> new File(location.toString() + "/" + p.getFileName()))
                    .map(file -> {
                        try {
                            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                            return dBuilder.parse(file);
                        }
                        catch (Exception e){
                            throw new RuntimeException(e);
                        }
                    }).collect(Collectors.toList());
        }
        catch (IOException e) {
            throw new StorageException("Failed to read stored files", e);
        }
    }
}
