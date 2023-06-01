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
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.parser.InvokerParserImp;
import com.becon.opencelium.backend.invoker.resource.OperationResource;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.resource.connector.FunctionResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.resource.connector.InvokerXMLResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.PathUtility;
import com.becon.opencelium.backend.utility.Xml;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@Tag(name = "Invoker", description = "Manages operations related to Invoker management")
@RequestMapping(value = "/api/invoker", produces = MediaType.APPLICATION_JSON_VALUE)
public class InvokerController {

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private InvokerContainer invokerContainer;

    @Operation(summary = "Retrieves an 'invoker' based on the provided invoker 'name'")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Invoker has been successfully retrieved",
                content = @Content(schema = @Schema(implementation = InvokerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{name}")
    public ResponseEntity<?> get(@PathVariable String name) throws Exception {
        InvokerResource invokerResources = invokerService.toResource(invokerService.findByName(name));
        return ResponseEntity.ok(invokerResources);
    }

    @Operation(summary = "Retrieves all invokers")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "List of Invokers have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = InvokerResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<?> getAll() throws Exception {

        List<InvokerResource> invokerResources = invokerService.findAll()
                .stream().map(inv -> invokerService.toResource(inv))
                .collect(Collectors.toList());

        final CollectionModel<InvokerResource> resources = CollectionModel.of(invokerResources);
        return ResponseEntity.ok(resources);
    }

    @Operation(summary = "Creates new invoker")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Invoker has been successfully created",
                content = @Content(schema = @Schema(implementation = InvokerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody InvokerXMLResource invokerXMLResource)  {
        Document doc = convertStringToXMLDocument(invokerXMLResource.getXml());
        Objects.requireNonNull(doc);
        NodeList nodeList = doc.getChildNodes();
        Node node = nodeList.item(0);
        Node nameNode = node.getChildNodes().item(1);
        String filename = nameNode.getTextContent();
        if (invokerService.existsByName(filename)){
            throw new RuntimeException("INVOKER_ALREADY_EXISTS");
        }

        try {
            TransformerFactory tFactory = TransformerFactory.newInstance();
            Transformer transformer = tFactory.newTransformer();
            DOMSource source = new DOMSource(doc);
            StreamResult result = new StreamResult(new File(PathConstant.INVOKER + "/" + filename + ".xml"));
            transformer.transform(source, result);
        } catch (TransformerException ex){
            throw new RuntimeException(ex);
        }

        List<Document> invokers = getAllInvokers();
        Map<String, Invoker> container = new HashMap<>();
        invokers.forEach(document -> {
            InvokerParserImp parser = new InvokerParserImp(document);
            File f = new File(document.getDocumentURI());
            String invoker = FileNameUtils.removeExtension(f.getName());
            invoker = invoker.replace("%20", " ");
            container.put(invoker, parser.parse());
        });
        invokerContainer.updateAll(container);

        Invoker invoker = invokerContainer.getByName(filename);
        InvokerResource invokerResource = invokerService.toResource(invoker);
        final EntityModel<InvokerResource> resource = EntityModel.of(invokerResource);
        return ResponseEntity.ok().body(resource);
    }

    @Operation(summary = "Deletes an invoker by provided invoker 'name'")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Invoker has been successfully removed",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{name}")
    public ResponseEntity<?> delete(@PathVariable String name){
        invokerService.delete(name);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Deletes a collection of invokers based on the provided list of their corresponding 'names'.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "List of Invokers have been successfully removed"),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteInvokerByNameIn(@RequestBody List<String> invokerNames){
        invokerNames.forEach(name -> {
            invokerService.delete(name);
        });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Modifies fields in operations by providing invoker name and by accepting 'Operation' data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Field in operation hase been successfully modified",
                content = @Content(schema = @Schema(implementation = FunctionResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/{invokerName}/xml", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FunctionResource> updateField(@PathVariable String invokerName,
                                                        @RequestBody OperationResource operationResource) {
        try {
            Document invoker = invokerService.getDocument(invokerName + ".xml");
            Xml xml = new Xml(invoker, invokerName + ".xml");
            String path = operationResource.getPath();
            String method = operationResource.getMethod();

            // /invoker/.../.../f1/f2/f3
            String xpath = PathUtility.convertToXpath(path, method);
            xml.addFields(xpath, operationResource);
            xml.save();
            invokerService.save(invoker);

            NodeList methodNode = xml.getNodeListByXpath(PathUtility.getXPathTillMethod(method));
            InvokerParserImp invokerParserImp = new InvokerParserImp(invoker);
            FunctionInvoker functionInvoker = invokerParserImp.getFunctions(methodNode).get(0);
            FunctionResource resource = new FunctionResource(functionInvoker);
            return ResponseEntity.ok(resource);
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException(ex);
        }
    }

    private static Document convertStringToXMLDocument(String xmlString)
    {
        //Parser that produces DOM object trees from XML content
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        //API to obtain DOM Document instance
        DocumentBuilder builder = null;
        try
        {
            //Create DocumentBuilder with default configuration
            builder = factory.newDocumentBuilder();

            //Parse the content to Document object
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return null;
    }

    private List<Document> getAllInvokers(){
        Path location = Paths.get(PathConstant.INVOKER);
        try {
            Stream<Path> allInvokers = Files.walk(location, 1)
                    .filter(path -> !path.equals(location))
                    .map(location::relativize);

            return allInvokers.map(p -> new File(location.toString() + "/" + p.getFileName()))
                    .map(file -> {
                        try {
                            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                            return dBuilder.parse(file);
                        }
                        catch (Exception e){
                            throw new RuntimeException(e);
                        }
                    }).collect(Collectors.toList());
        }
        catch (IOException e) {
            throw new StorageException("Failed to read stored files", e);
        }
    }
}
