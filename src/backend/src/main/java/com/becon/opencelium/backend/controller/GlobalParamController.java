package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.entity.GlobalParam;
import com.becon.opencelium.backend.mysql.service.GlobalParamServiceImp;
import com.becon.opencelium.backend.resource.application.GlobalParamResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/global_param", produces = "application/hal+json", consumes = {"application/json"})
public class GlobalParamController {

    @Autowired
    private GlobalParamServiceImp globalParamServiceImp;

    @GetMapping("/all/{name}")
    public ResponseEntity<?> getAllByName(@PathVariable String name) {
        List<GlobalParam> globalParams = globalParamServiceImp.getAllByName(name);
        List<GlobalParamResource> globalParamResources = globalParams.stream()
                .map(GlobalParamResource::new).collect(Collectors.toList());
        return ResponseEntity.ok(globalParamResources);
    }

    @GetMapping("/{name}")
    public ResponseEntity<?> get(@PathVariable String name) {
        GlobalParam globalParams = globalParamServiceImp.findByName(name);
        GlobalParamResource globalParamResource = globalParamServiceImp.toResource(globalParams);
        return ResponseEntity.ok(globalParamResource);
    }

    @GetMapping
    public ResponseEntity<?> post(@RequestBody GlobalParamResource globalParamResource) {
        GlobalParam globalParam = globalParamServiceImp.toEntity(globalParamResource);
        globalParamServiceImp.save(globalParam);
        GlobalParamResource globalParamResources = globalParamServiceImp.toResource(globalParam);
        return ResponseEntity.ok(globalParamResources);
    }
}
