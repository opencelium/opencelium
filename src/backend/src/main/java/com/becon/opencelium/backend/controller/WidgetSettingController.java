package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.mysql.service.WidgetSettingServiceImp;
import com.becon.opencelium.backend.resource.user.UserWidgetsResource;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping(value = "/api/widget_setting", produces = "application/hal+json", consumes = {"application/json"})
public class WidgetSettingController {

    @Autowired
    private WidgetSettingServiceImp widgetSettingServiceImp;

    @Autowired
    private UserServiceImpl userService;
//
    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserWidgetsResource userWidgetsResource){
        int userId = userWidgetsResource.getUserId();
        User user  = userService.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        List<WidgetSetting> widgetSettings = userWidgetsResource.getWidgetSettings().stream()
                .map(uwr -> widgetSettingServiceImp.toEntity(uwr, userId)).collect(Collectors.toList());
        user.setWidgetSettings(widgetSettings);

        userService.save(user);
        List<WidgetSettingResource> widgetSettingResources = user.getWidgetSettings().stream()
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
