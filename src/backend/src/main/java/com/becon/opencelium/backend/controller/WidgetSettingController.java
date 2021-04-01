package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.mysql.service.WidgetSettingServiceImp;
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

    @PostMapping
    public ResponseEntity<?> create(@RequestBody WidgetSettingResource widgetSettingResource){
        WidgetSetting widgetSetting = widgetSettingServiceImp.toEntity(widgetSettingResource);
        widgetSettingServiceImp.create(widgetSetting);

        WidgetSettingResource resource = widgetSettingServiceImp.toResource(widgetSetting);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(resource.getWidgetId()).toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id){
        widgetSettingServiceImp.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody WidgetSettingResource widgetSettingResource){
        WidgetSetting widgetSetting = widgetSettingServiceImp.toEntity(widgetSettingResource);
        widgetSettingServiceImp.create(widgetSetting);

        WidgetSettingResource resource = widgetSettingServiceImp.toResource(widgetSetting);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(resource.getWidgetId()).toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @PutMapping("/all")
    public ResponseEntity<?> updateAll(@RequestBody List<WidgetSettingResource> widgetSettingResourceList) {

        List<WidgetSetting> widgetSettings = widgetSettingResourceList.stream()
                .map(wr -> widgetSettingServiceImp.toEntity(wr))
                .collect(Collectors.toList());

        widgetSettings.forEach(ws -> {
            widgetSettingServiceImp.create(ws);
        });

        List<WidgetSettingResource> resources = widgetSettings.stream()
                .map(ws -> widgetSettingServiceImp.toResource(ws))
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(resources);
    }

    @GetMapping("/all")
    public ResponseEntity<?> viewAll() {
        List<WidgetSetting> widgetSettings = widgetSettingServiceImp.findAll();
        List<WidgetSettingResource> resources = widgetSettings.stream()
                .map(ws -> widgetSettingServiceImp.toResource(ws))
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> view(@PathVariable("id") int id){
        WidgetSetting widgetSetting = widgetSettingServiceImp.findById(id);
        return ResponseEntity.ok().body(widgetSetting);
    }
}
