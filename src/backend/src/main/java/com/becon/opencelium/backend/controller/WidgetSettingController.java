package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserWidgetsResource;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@Tag(name = "Widget Settings", description = "Manages operations related to WidgetSetting that contains coordinates of widget for frontend")
@RequestMapping(value = "/api/widget_setting", produces = MediaType.APPLICATION_JSON_VALUE)
public class WidgetSettingController {

    @Autowired
    private WidgetSettingServiceImp widgetSettingServiceImp;

    @Autowired
    private UserServiceImpl userService;

    @Operation(summary = "Creates a new widget setting related to user")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "201",
                    description = "Widget Settings are successfully created.",
                    content = @Content(schema = @Schema(implementation = UserWidgetsResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> create(@RequestBody UserWidgetsResource userWidgetsResource){
        int userId = userWidgetsResource.getUserId();
        User user  = userService.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        List<WidgetSetting> initWidgetSettings = widgetSettingServiceImp.findAllByUserId(userId);
        List<WidgetSetting> widgetSettings = userWidgetsResource.getWidgetSettings().stream()
                .map(uwr -> widgetSettingServiceImp.toEntity(uwr, userId)).collect(Collectors.toList());

        if (widgetSettings.isEmpty()) {
            widgetSettingServiceImp.deleteAll();
        } else {
            initWidgetSettings.forEach(iws -> {
                boolean contains = false;
                for (WidgetSetting ws : widgetSettings) {
                    if (ws.getId() == iws.getId()) {
                        contains = true;
                        break;
                    }
                }
                if (!contains) {
                    widgetSettingServiceImp.deleteById(iws.getId());
                }
            });
        }

        widgetSettingServiceImp.saveAll(widgetSettings);

        initWidgetSettings = widgetSettingServiceImp.findAllByUserId(userId);
        List<WidgetSettingResource> widgetSettingResources = initWidgetSettings.stream()
                .map(ws -> widgetSettingServiceImp.toResource(ws)).collect(Collectors.toList());
        UserWidgetsResource resource = new UserWidgetsResource();
        resource.setUserId(user.getId());
        resource.setWidgetSettings(widgetSettingResources);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(resource.getUserId()).toUri();
        return ResponseEntity.created(uri).body(resource);
    }
//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> delete(@PathVariable("id") int id){
//        widgetSettingServiceImp.deleteById(id);
//        return ResponseEntity.noContent().build();
//    }
//
//    @PutMapping
//    public ResponseEntity<?> update(@RequestBody WidgetSettingResource widgetSettingResource){
//        WidgetSetting widgetSetting = widgetSettingServiceImp.toEntity(widgetSettingResource);
//        widgetSettingServiceImp.create(widgetSetting);
//
//        WidgetSettingResource resource = widgetSettingServiceImp.toResource(widgetSetting);
//        final URI uri = MvcUriComponentsBuilder
//                .fromController(getClass())
//                .path("/{id}")
//                .buildAndExpand(resource.getWidgetId()).toUri();
//        return ResponseEntity.created(uri).body(resource);
//    }
//
//    @PutMapping("/all")
//    public ResponseEntity<?> updateAll(@RequestBody List<WidgetSettingResource> widgetSettingResourceList) {
//
//        List<WidgetSetting> widgetSettings = widgetSettingResourceList.stream()
//                .map(wr -> widgetSettingServiceImp.toEntity(wr))
//                .collect(Collectors.toList());
//
//        widgetSettings.forEach(ws -> {
//            widgetSettingServiceImp.create(ws);
//        });
//
//        List<WidgetSettingResource> resources = widgetSettings.stream()
//                .map(ws -> widgetSettingServiceImp.toResource(ws))
//                .collect(Collectors.toList());
//        return ResponseEntity.ok().body(resources);
//    }
//
//    @GetMapping("/all")
//    public ResponseEntity<?> viewAll() {
//        List<WidgetSetting> widgetSettings = widgetSettingServiceImp.findAll();
//        List<WidgetSettingResource> resources = widgetSettings.stream()
//                .map(ws -> widgetSettingServiceImp.toResource(ws))
//                .collect(Collectors.toList());
//        return ResponseEntity.ok().body(resources);
//    }
//
//    @GetMapping("/{id}")
//    public ResponseEntity<?> view(@PathVariable("id") int id){
//        WidgetSetting widgetSetting = widgetSettingServiceImp.findById(id);
//        return ResponseEntity.ok().body(widgetSetting);
//    }
//

    @Operation(summary = "Return widgets of user by provided userId")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Widget has been successfully retrieved.",
                    content = @Content(schema = @Schema(implementation = UserWidgetsResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/user/{id}")
    public ResponseEntity<?> getByUserId(@PathVariable("id") int id){
        List<WidgetSetting> widgetSetting = widgetSettingServiceImp.findByUserId(id);
        List<WidgetSettingResource> resources = widgetSetting.stream()
                .map(ws -> widgetSettingServiceImp.toResource(ws))
                .collect(Collectors.toList());
        UserWidgetsResource userWidgetsResource = new UserWidgetsResource();
        userWidgetsResource.setUserId(id);
        userWidgetsResource.setWidgetSettings(resources);
        return ResponseEntity.ok().body(userWidgetsResource);
    }
}
