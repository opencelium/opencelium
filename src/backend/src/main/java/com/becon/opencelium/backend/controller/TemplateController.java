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
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateServiceImp;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.UrlResource;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Template", description = "Manages operations related to template")
@RequestMapping(value = "/api/template", produces = MediaType.APPLICATION_JSON_VALUE)
public class TemplateController {

    @Autowired
    private TemplateServiceImp templateService;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Operation(summary = "Retrieves a template from the database based on the provided template 'id'")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Template has been retrieved successfully",
                content = @Content(schema = @Schema(implementation = TemplateResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id){

        Template template = templateService
                .findById(id)
                .orElseThrow(() -> new RuntimeException("TEMPLATE_NOT_FOUND"));
        TemplateResource templateResource = templateService.toResource(template);
        return ResponseEntity.ok().body(templateResource);
    }

    @Operation(summary = "Retrieves a template from the database based on the provided connectionId")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Template has been retrieved successfully",
                    content = @Content(schema = @Schema(implementation = TemplateResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/connection/{connectionId}")
    public ResponseEntity<?> getByConnectionId(@PathVariable Long connectionId){
        TemplateResource resource = templateService.getByConnectionId(connectionId);
        return ResponseEntity.ok().body(resource);
    }

    @Operation(summary = "Checks if a template with given id is exists or not")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Exists or not ",
                    content = @Content(schema = @Schema(implementation = Boolean.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/check/{id}")
    public ResponseEntity<Boolean> exists(@PathVariable String id){
        return ResponseEntity.ok(templateService.existsById(id));
    }


    @Operation(summary = "Retrieves templates from database based on 'from' and 'to' connector 'id's")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Templates for connectors have been retrieved successfully",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all/{fromConnectorId}/{toConnectorId}")
    public ResponseEntity<List<TemplateResource>> getAllByConnectors(@PathVariable int fromConnectorId, @PathVariable int toConnectorId){
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

        return ResponseEntity.ok().body(templateResources);
    }

    @Operation(summary = "Retrieves all templates from database")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "All templates have been retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<TemplateResource>> getAll(){

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

        return ResponseEntity.ok().body(templateResources);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody TemplateResource templateResource) throws JsonProcessingException {

        String templateId = "";
        try {
            String id = UUID.randomUUID().toString();
            templateResource.setTemplateId(id);
            Template template = templateService.toEntity(templateResource);
            templateService.save(template);
            templateId = template.getTemplateId();
            final EntityModel<TemplateResource> resource = EntityModel.of(templateService.toResource(template));
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            templateService.deleteById(templateId);
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Downloads template by given filename")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Template has been successfully downloaded",
                    content = @Content(schema = @Schema(implementation = byte[].class)),
                    headers = {
                        @Header(
                            name = "Content-Disposition",
                            description = "attachment; filename=\"example-file.json\""
                        )
                    }),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @ResponseBody
    @GetMapping("/file/{filename:.+}")
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

    @Operation(summary = "Modifies template by given id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Template has been successfully modified",
                content = @Content(schema = @Schema(implementation = TemplateResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> modify(@RequestBody TemplateResource templateResource) throws JsonProcessingException {
        Template template = templateService.toEntity(templateResource);
        if (templateService.existsById(template.getTemplateId())) {
            templateService.deleteById(templateResource.getTemplateId());
        }
        templateService.save(template);
        final EntityModel<TemplateResource> resource = EntityModel.of(templateService.toResource(template));
        return ResponseEntity.ok().body(resource);
    }

    @Operation(summary = "Modifies a list of templates")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Template has been successfully modified",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/all", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> modifyAll(@RequestBody List<TemplateResource> templateResources) throws JsonProcessingException {

        templateResources.forEach(tr -> {
            Template template = templateService.toEntity(tr);
            if (templateService.existsById(template.getTemplateId())) {
                templateService.deleteById(tr.getTemplateId());
            }
            templateService.save(template);
        });
        return ResponseEntity.ok().body(templateResources);
    }

    @Operation(summary = "Removes a template by given id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "Template has been successfully removed",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id){
        templateService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Removes templates by given list of ids")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "Templates have been successfully removed",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/list/delete")
    public ResponseEntity<?> deleteTemplateByIdIn(@RequestBody IdentifiersDTO<String> ids){

        ids.getIdentifiers().forEach(id -> {
            templateService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }
}
