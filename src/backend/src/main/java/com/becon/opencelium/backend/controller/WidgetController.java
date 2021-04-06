package com.becon.opencelium.backend.controller;


import com.becon.opencelium.backend.mysql.entity.Widget;
import com.becon.opencelium.backend.mysql.service.WidgetServiceImp;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping(value = "/api/widget", produces = "application/hal+json", consumes = {"application/json"})
public class WidgetController {

    @Autowired
    private WidgetServiceImp widgetServiceImp;

    @PostMapping
    public ResponseEntity<?> save(@RequestBody WidgetResource widgetResource){
        Widget widget = widgetServiceImp.toEntity(widgetResource);
        widgetServiceImp.save(widget);

        WidgetResource resource = widgetServiceImp.toResource(widget);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(resource.getId()).toUri();
        return ResponseEntity.created(uri).body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id){
        widgetServiceImp.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<?> viewAll() {
        List<Widget> widgets = widgetServiceImp.findAll();
        List<WidgetResource> resources = widgets.stream()
                .map(ws -> widgetServiceImp.toResource(ws))
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> view(@PathVariable("id") int id){
        Widget widget = widgetServiceImp.findById(id).orElseThrow(() -> new RuntimeException("Widget not found"));
        return ResponseEntity.ok().body(widget);
    }
}
