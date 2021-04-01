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

    @DeleteMapping("/{name}")
    public ResponseEntity<?> delete(@PathVariable String name){
        widgetSettingServiceImp.deleteByName(name);
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

    @GetMapping("/{name}")
    public ResponseEntity<?> view(@PathVariable String name){
        WidgetSetting widgetSetting = widgetSettingServiceImp.findByName(name);
        return ResponseEntity.ok().body(widgetSetting);
    }
}
