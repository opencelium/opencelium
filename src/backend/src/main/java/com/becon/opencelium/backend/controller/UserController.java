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

import com.becon.opencelium.backend.database.mysql.service.TotpService;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.exception.EmailAlreadyExistException;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.exception.SessionNotFoundException;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.SessionServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.SessionTotpCodeResource;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.becon.opencelium.backend.security.UserPrincipals;
import com.becon.opencelium.backend.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@Tag(name = "User", description = "Manages operations related to user management")
@RequestMapping(value = "/api/user", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserController {

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private UserRoleServiceImpl userRoleService;

    @Autowired
    private SessionServiceImpl sessionService;

    @Autowired
    private StorageService storageService;

    @Autowired
    private TotpService totpService;


    @Operation(summary = "Retrieves user data from the database based on the provided user 'id'")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "The user has been successfully retrieved",
                content = @Content(schema = @Schema(implementation = UserResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") int id) throws IOException {
        return userService.findById(id).map(p ->
                ResponseEntity.ok(new UserResource(p))).orElseThrow(() -> new UserNotFoundException(id));
    }

    @Operation(summary = "Checks the existence of an user email in the system")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "The email address exists in the system.",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/check/{email}")
    public ResponseEntity<?> emailExists(@PathVariable("email") String email) {
        if (userService.existsByEmail(email)){
            throw new ResponseStatusException(HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }
//
    @Operation(summary = "Retrieves a list of all users in the application")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Returns list of users",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<UserResource>> all(){
        final List<UserResource> userResources =
                userService.findAll().stream().map(UserResource::new).collect(Collectors.toList());
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(userResources);
    }
//
    @Operation(summary = "Creates a new user in the system by accepting user data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                      description = "User is successfully created. The 'id' property will include newly created user's 'id'",
                      content = @Content(schema = @Schema(implementation = UserResource.class))),
        @ApiResponse( responseCode = "401",
                      description = "Unauthorized",
                      content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                      description = "Internal Error",
                      content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> post(@RequestBody UserRequestResource userRequestResource) throws IOException {

        if (userService.existsByEmail(userRequestResource.getEmail())){
            throw new EmailAlreadyExistException(userRequestResource.getEmail());
        }

        if (!userRoleService.existsById(userRequestResource.getUserGroup())){
            throw new RoleNotFoundException(userRequestResource.getUserGroup());
        }

        UserDetailResource userDetailResource = userRequestResource.getUserDetail();
        if(userDetailResource.getLang() == null || userDetailResource.getLang().isEmpty()){
            userDetailResource.setLang(LangEnum.EN.getCode());
            userRequestResource.setUserDetail(userDetailResource);
        } else {
            LangEnum.valueOf(userDetailResource.getLang().toUpperCase(Locale.ROOT));
        }

        User user = userService.requestToEntity(userRequestResource);
        userService.save(user);

        UserResource userResource = userService.toResource(user);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(user.getId()).toUri();

        return ResponseEntity.created(uri).body(userResource);
    }

    @Operation(summary = "Updates an existed user in the system by accepting user data in the request body ")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "User is successfully updated.",
                content = @Content(schema = @Schema(implementation = UserResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    // due to frontend requirements, for all changes need to send all user data. if something will be missed it will
    // save empty values
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update( @PathVariable("id") int id,
                                     @RequestBody UserRequestResource userRequestResource) throws IOException {

        if (!userService.existsById(id)){
            throw new UserNotFoundException(id);
        }
        userRequestResource.setUserId(id);
        UserDetailResource userDetailResource = userRequestResource.getUserDetail();
        if(userDetailResource.getLang() == null || userDetailResource.getLang().isEmpty()){
            userDetailResource.setLang("en");
            userRequestResource.setUserDetail(userDetailResource);
        }

        User user = userService.requestToEntity(userRequestResource);
        userService.save(user);

        return ResponseEntity.ok().body(userRequestResource);
    }

    @Operation(summary = "Deletes a user by 'id' ")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "User is successfully deleted.",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id) {
        return userService
                .findById(id)
                .map(
                        p -> {
                            // if user has an image delete the image from storage
                            if (p.getUserDetail().getProfilePicture() != null){
                                storageService.delete(p.getUserDetail().getProfilePicture());
                            }
                            // delete user
                            userService.deleteById(id);
                            return ResponseEntity.noContent().build();
                        })
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Operation(summary = "Deletes users by ids ")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "Users are successfully deleted.",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = Integer.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteUsersById(@RequestBody IdentifiersDTO<Integer> payload) {
        payload.getIdentifiers().forEach(id -> {
            User p = userService.findById(id).orElseThrow(() -> new UserNotFoundException(id));
            if (p.getUserDetail().getProfilePicture() != null){
                storageService.delete(p.getUserDetail().getProfilePicture());
            }
            userService.deleteById(id);
        });

        return ResponseEntity.noContent().build();
    }
//
    @Operation(summary = "Logs out the currently authenticated user.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "User is successfully logged out.",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}/logout")
    public ResponseEntity<?> logout(@PathVariable("id") int userId) {
        // skip userId, instead logout current user
        int id = getCurrentUserId();

        return sessionService
                .findByUserId(id)
                .map(s -> {
                    s.setActive(false);
                    sessionService.save(s);

                    return ResponseEntity.ok().build();
                })
                .orElseThrow(() -> new SessionNotFoundException(id));
    }

    @Operation(summary = "Returns QR and totp secret")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "QR and totp code is successfully generated.",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/totp-qr")
    public ResponseEntity<?> getTotpQrAndSecret() {
        // totp related actions should be done only by users themselves
        int userId = getCurrentUserId();

        return ResponseEntity.ok(totpService.getTotpResource(userId));
    }

    @Operation(summary = "Enables or disables TOTP to current user")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "TOTP is successfully enabled to logged in user",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/totp/{action}")
    public ResponseEntity<?> totpAction(@PathVariable("action") String action, @RequestBody SessionTotpCodeResource dto) {
        // totp related actions should be done only by users themselves
        int userId = getCurrentUserId();

        if ("enable".equals(action)) {
            return ResponseEntity.ok(totpService.enableTotp(userId, dto.getCode()));
        }

        if ("disable".equals(action)) {
            return ResponseEntity.ok(totpService.disableTotp(userId, dto.getCode()));
        }

        throw new RuntimeException("Wrong TOTP action is supplied, available options: [enable, disable]");
    }

    @Operation(summary = "Returns status of QR code by secretKey.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "QR and Secret Key existed already.",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/totp-qr/exists")
    public ResponseEntity<?> isQRCodeExists() {
        // totp related actions should be done only by users themselves
        int userId = getCurrentUserId();
        User user = userService.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        ResultDTO<Boolean> resultDTO = new ResultDTO<>();
        resultDTO.setResult(false);
        if (user.getTotpSecretKey() != null) {
            resultDTO.setResult(true);
        }
        return ResponseEntity.ok(resultDTO);
    }

    /*
    Returns request sending users id
    */
    private int getCurrentUserId() {
        UserPrincipals userPrincipals = (UserPrincipals) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        return userPrincipals.getUser().getId();
    }
}
