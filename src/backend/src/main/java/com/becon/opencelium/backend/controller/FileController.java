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

import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.storage.UserStorageService;
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
        checkImageExtension(extension);

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
        checkImageExtension(extension);

        // Get userGroup data from database
        UserRole userRole = userRoleService.getOne(userGroupId);

        //Generate new file name
        String newFilename = UUID.randomUUID().toString() + "." + extension;

        // If user group has an old image, delete the picture from image
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

    private void checkImageExtension(String extension){
        if (!(extension.equals("jpeg") || extension.equals("png")
                || extension.equals("jpg"))){
            throw new StorageException("File should be jpg or png");
        }
    }
}
