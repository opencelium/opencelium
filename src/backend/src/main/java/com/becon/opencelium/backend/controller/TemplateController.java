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

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.UrlResource;
import org.springframework.hateoas.Resource;
import org.springframework.hateoas.Resources;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.MalformedURLException;
import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/template", produces = "application/hal+json", consumes = {"application/json"})
public class TemplateController {

    @Autowired
    private TemplateServiceImp templateService;

    @Autowired
    private ConnectorServiceImp connectorService;

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id){

        Template template = templateService
                .findById(id)
                .orElseThrow(() -> new RuntimeException("TEMPLATE_NOT_FOUND"));
//        TemplateResource templateResource = templateService.toResource(template);
//        final Resource<TemplateResource> resource = new Resource<>(templateResource);
        return ResponseEntity.ok().body(template);
    }

    @GetMapping("/all/{fromConnectorId}/{toConnectorId}")
    public ResponseEntity<?> getAllByConnectors(@PathVariable int fromConnectorId, @PathVariable int toConnectorId){
        Connector fromConnector = connectorService.findById(fromConnectorId)
                .orElseThrow(() -> new ConnectorNotFoundException(fromConnectorId));
        Connector toConnector = connectorService.findById(toConnectorId)
                .orElseThrow(() -> new ConnectorNotFoundException(toConnectorId));

        List<Template> templates = templateService
                .findByFromInvokerAndToInvoker(fromConnector.getInvoker(), toConnector.getInvoker());

        if (templates.isEmpty()){
            return ResponseEntity.noContent().build();
        }

        List<TemplateResource> templateResources = new ArrayList<>();
        templates.forEach(t -> {
            TemplateResource templateResource = templateService.toResource(t);
            templateResource.getConnection().getFromConnector().setConnectorId(fromConnectorId);
            templateResource.getConnection().getToConnector().setConnectorId(toConnectorId);
            templateResources.add(templateResource);
        });

        final Resources<TemplateResource> resources = new Resources<>(templateResources);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resources);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(){

        List<Template> templates = templateService.findAll();

        if (templates.isEmpty()){
            return ResponseEntity.noContent().build();
        }

        List<TemplateResource> templateResources = new ArrayList<>();
        templates.forEach(t -> {
            if (t == null){
                return;
            }
            TemplateResource templateResource = templateService.toResource(t);
            templateResources.add(templateResource);
        });

        final Resources<TemplateResource> resources = new Resources<>(templateResources);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resources);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody TemplateResource templateResource) throws JsonProcessingException {

        String templateId = "";
        try {
            String id = UUID.randomUUID().toString();
            templateResource.setTemplateId(id);
            Template template = templateService.toEntity(templateResource);
            templateService.save(template);
            templateId = template.getTemplateId();
            final Resource<TemplateResource> resource = new Resource<>(templateService.toResource(template));
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            templateService.deleteById(templateId);
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/file/{filename:.+}")
    @ResponseBody
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String filename) {

        try {
            Path rootLocation = Paths.get(PathConstant.TEMPLATE);
            Path filePath = rootLocation.resolve(filename);
            org.springframework.core.io.Resource file = new UrlResource(filePath.toUri());
            if (!file.exists() || !file.isReadable()) {
                throw new StorageFileNotFoundException("Could not read file: " + filename);
            }
            return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + file.getFilename() + "\"").body(file);
        }
        catch (MalformedURLException e) {
            throw new StorageFileNotFoundException("Could not read file: " + filename, e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modify(@RequestBody TemplateResource templateResource) throws JsonProcessingException {
        Template template = templateService.toEntity(templateResource);
        if (templateService.existsById(template.getTemplateId())) {
            templateService.deleteById(templateResource.getTemplateId());
        }
        templateService.save(template);
        final Resource<TemplateResource> resource = new Resource<>(templateService.toResource(template));
        return ResponseEntity.ok().body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id){
        templateService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
