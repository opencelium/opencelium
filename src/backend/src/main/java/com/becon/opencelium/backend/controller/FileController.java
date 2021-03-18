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

import com.becon.opencelium.backend.application.service.AssistantServiceImp;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

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

    @PostMapping(value = "/assistant/zipfile")
    public ResponseEntity<?> assistantUploadFile(@RequestParam("file") MultipartFile file) {
        assistantServiceImp.uploadZipFile(file,"repository/zipfile/");
        return ResponseEntity.ok().build();
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
}
