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
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.connector.FunctionDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
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
import liquibase.util.file.FilenameUtils;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
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
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private ConnectionServiceImp connectionService;

    @Operation(summary = "Retrieves an 'invoker' based on the provided invoker 'name'")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Invoker has been successfully retrieved",
                content = @Content(schema = @Schema(implementation = InvokerDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{name}")
    public ResponseEntity<?> get(@PathVariable String name) throws Exception {
        InvokerDTO invokerResources = invokerService.toResource(invokerService.findByName(name));
        return ResponseEntity.ok(invokerResources);
    }

    @Operation(summary = "Retrieves all invokers")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "List of Invokers have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = InvokerDTO.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<InvokerDTO>> getAll() throws Exception {

        List<InvokerDTO> invokerDTOS = invokerService.findAll()
                .stream().map(inv -> invokerService.toResource(inv))
                .collect(Collectors.toList());
        return ResponseEntity.ok(invokerDTOS);
    }

    @Operation(summary = "Checks by name whether an invoker exist or not")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Property 'result' contains a boolean value true(exists) or false(not exists)",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/exists/{invokerName}")
    public ResponseEntity<ResultDTO<Boolean>> existsByName(@PathVariable String invokerName) throws Exception {
        Boolean result = invokerService.existsByName(invokerName);
        ResultDTO<Boolean> resultDTO = new ResultDTO<>(result);
        return ResponseEntity.ok(resultDTO);
    }

    @Operation(summary = "Checks by filename whether an invoker exist or not")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Property 'result' contains a boolean value true(exists) or false(not exists)",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/file/exists/{fileName}")
    public ResponseEntity<ResultDTO<Boolean>> existsByFileName(@PathVariable String fileName) throws Exception {
        Boolean result = invokerService.existsByFileName(fileName);
        ResultDTO<Boolean> resultDTO = new ResultDTO<>(result);
        return ResponseEntity.ok(resultDTO);
    }

    @Operation(summary = "Creates new invoker")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Invoker has been successfully created",
                content = @Content(schema = @Schema(implementation = InvokerDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody InvokerXMLResource invokerXMLResource) throws Exception  {
        Document doc = convertStringToXMLDocument(invokerXMLResource.getXml());
        Objects.requireNonNull(doc);
        XPathFactory xPathFactory = XPathFactory.newInstance();
        XPath xpath = xPathFactory.newXPath();
        XPathExpression expression = xpath.compile("/invoker/name");
        String filename = expression.evaluate(doc);
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

        List<Document> invokers;
        Map<String, Invoker> container = new HashMap<>();
        try {
            invokers = getAllInvokers();
        } catch (Exception e) {
            delete(filename);
            throw new RuntimeException(e);
        }
        invokers.forEach(document -> {
            InvokerParserImp parser = new InvokerParserImp(document);
            File f = new File(document.getDocumentURI());
            String invoker = FileNameUtils.removeExtension(f.getName());
            invoker = invoker.replace("%20", " ");
            container.put(invoker, parser.parse());
        });

        invokerContainer.updateAll(container);

        Invoker invoker = invokerContainer.getByName(filename);
        if (invoker.getOperations() == null) {
            delete(filename);
            throw new RuntimeException("Invoker should contain at least one Operation.");
        }
        InvokerDTO invokerDTO = invokerService.toResource(invoker);
        return ResponseEntity.ok().body(invokerDTO);
    }

    @Operation(summary = "Validates whether an invoker is used in connection or in connector")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Property 'result' contains a boolean value true(has dependency) or false(no dependency)",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{name}/dependency")
    public ResponseEntity<ResultDTO<Boolean>> hasDependency(@PathVariable String name){
        Boolean result = connectorService.existByInvoker(name);
        ResultDTO<Boolean> resultDTO = new ResultDTO<>(result);
        return ResponseEntity.ok(resultDTO);
    }

    @Operation(summary = "Deletes an invoker by provided invoker 'name' and removes all dependencies")
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
    @DeleteMapping("/{invokerName}/force")
    public ResponseEntity<?> deleteForce(@PathVariable String invokerName){
        List<Connector> connector = connectorService.findAllByInvoker(invokerName);
        connectorService.deleteByInvoker(invokerName);
        connector.forEach(ctor -> {
            List<Connection> ctions = connectionService.findAllByConnectorId(ctor.getId());
            if (ctions == null) {
                return;
            }
            ctions.forEach(ction -> {
                connectionService.deleteById(ction.getId());
            });
        });
        invokerService.delete(invokerName);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes an invoker by provided invoker 'name'. If invoker has dependencies then throws exception.")
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
        if(connectorService.existByInvoker(name)) {
            throw new RuntimeException("Couldn't delete because invoker '" + name + "' has references to connector and connection. ");
        }
        invokerService.deleteInvokerFile(name);
        return ResponseEntity.noContent().build();
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
    public ResponseEntity<?> deleteInvokerListByNames(@RequestBody IdentifiersDTO<String> invokerNames){
        invokerNames.getIdentifiers().forEach(name -> {
            invokerService.delete(name);
        });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Modifies fields in operations by providing invoker name and by accepting 'Operation' data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Field in operation hase been successfully modified",
                content = @Content(schema = @Schema(implementation = FunctionDTO.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/{invokerName}/xml", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FunctionDTO> updateField(@PathVariable String invokerName,
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
            FunctionDTO resource = new FunctionDTO(functionInvoker);
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
                    .filter(f -> f.getName().endsWith(".xml"))
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
