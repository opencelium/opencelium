package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.resource.search.SearchResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/search", produces = "application/hal+json", consumes = "application/json")
public class SearchController {

    @Autowired
    private ConnectorServiceImp connectorServiceImp;

    @Autowired
    private ConnectionServiceImp connectionServiceImp;

    @Autowired
    private SchedulerServiceImp schedulerServiceImp;


    @GetMapping("/{title}")
    public ResponseEntity<?> searchByTitle(@PathVariable String title){

        List<SearchResource> results = new ArrayList<>();
        results.addAll(
                connectionServiceImp.findAllByNameContains(title).stream().filter(Objects::nonNull).map(SearchResource::new).collect(Collectors.toList())
        );

        results.addAll(
                connectorServiceImp.findAllByTitleContains(title).stream().filter(Objects::nonNull).map(SearchResource::new).collect(Collectors.toList())
        );

        results.addAll(
                schedulerServiceImp.findAllByTitleContains(title).stream().filter(Objects::nonNull).map(SearchResource::new).collect(Collectors.toList())
        );

        return ResponseEntity.ok().body(results);
    }
}
