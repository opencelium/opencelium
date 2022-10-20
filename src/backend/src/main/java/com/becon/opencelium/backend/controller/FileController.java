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

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.application.assistant.AssistantServiceImp;
import com.becon.opencelium.backend.application.assistant.UpdatePackageServiceImp;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.application.AvailableUpdateResource;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.jayway.jsonpath.JsonPath;
import io.netty.handler.codec.serialization.ObjectEncoder;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Controller
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

//    @Autowired
//    private InvokerContainer invokerContainer;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    private final UserStorageService storageService;

    @Autowired
    public FileController(UserStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(value = "/profilePicture")
    public ResponseEntity<?> profilePictureUpload(@RequestParam("file") MultipartFile file,
                                                  @RequestParam("email") String email) {
        // Get extension
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());

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

    @PostMapping("/groupIcon")
    public ResponseEntity<?> groupPictureUpload(@RequestParam("file") MultipartFile file,
                                                @RequestParam("userGroupId") int userGroupId) {

        // Get extension of file
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());

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

    @PostMapping(value = "/template")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        // Get extension
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        if (!checkJsonExtension(extension)){
            throw new StorageException("File should be JSON");
        }

        try {
            //Generate new file name
            String id = UUID.randomUUID().toString();
            // Save file in storage
            ObjectMapper objectMapper = new ObjectMapper();
            Template template = objectMapper.readValue(file.getBytes(), Template.class);
            template.setTemplateId(id);
            templateService.save(template);
            final org.springframework.hateoas.Resource<TemplateResource> resource
                    = new org.springframework.hateoas.Resource<>(templateService.toResource(template));
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/invoker")
    public ResponseEntity<?> uploadInvoker(@RequestParam("file") MultipartFile file) {
        String filename = file.getOriginalFilename();

        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document doc = dBuilder.parse(file.getInputStream());
            doc.setDocumentURI(PathConstant.INVOKER + filename);
            Xml xml = new Xml(doc, filename);
            xml.save();
            invokerServiceImp.save(doc);
        }
        catch (Exception e) {
            invokerServiceImp.delete(FilenameUtils.removeExtension(filename));
            throw new StorageException("Failed to store file " + filename, e);
        }

        Invoker invoker = invokerServiceImp.findByName(FilenameUtils.removeExtension(filename));
        InvokerResource invokerResource = invokerServiceImp.toResource(invoker);
        return ResponseEntity.ok(invokerResource);
    }

    @PostMapping(value = "/connector")
    public ResponseEntity<?> connectorUpload(@RequestParam("file") MultipartFile file,
                                             @RequestParam("connectorId") int connectorId) {

        Connector connector = connectorService.findById(connectorId).orElseThrow(() ->
                new RuntimeException("CONNECTOR_NOT_FOUND"));
        // Get extension
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
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

    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @PostMapping(value = "/assistant/zipfile")
    public ResponseEntity<?> assistantUploadFile(@RequestParam("file") MultipartFile file) {
        try {
//            systemOverviewRepository.getCurrentVersionFromDb();
//            return ResponseEntity.ok().build();

//            Path source = assistantServiceImp.uploadZipFile(file,PathConstant.ASSISTANT + "zipfile/");
            String zipedAppVersion = assistantServiceImp.getVersion(file.getInputStream());
            Path target = Paths.get(PathConstant.ASSISTANT + PathConstant.VERSIONS + zipedAppVersion
                               .replace(".", "_"));
            Path pathToFolder = assistantServiceImp.unzipFolder(file.getInputStream(), target);
//            Path pathToZip = Paths.get(PathConstant.ASSISTANT + "zipfile/" + file.getOriginalFilename());
//            assistantServiceImp.deleteZipFile(pathToZip);
            String folder = pathToFolder.toString().replace(pathToFolder.getParent().toString() + File.separator, "");
            AvailableUpdate availableUpdate = updatePackageServiceImp.getOffVersionByFolder(folder);
            AvailableUpdateResource availableUpdateResource = updatePackageServiceImp.toResource(availableUpdate);
            return ResponseEntity.ok(availableUpdateResource);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @DeleteMapping(value = "/assistant/zipfile/{filename}")
    public ResponseEntity<?> assistantDeleteFile(@PathVariable String filename) {

        Path zipPath = Paths.get(PathConstant.ASSISTANT + PathConstant.VERSIONS + filename);
        assistantServiceImp.deleteZipFile(zipPath);

        return ResponseEntity.noContent().build();
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
