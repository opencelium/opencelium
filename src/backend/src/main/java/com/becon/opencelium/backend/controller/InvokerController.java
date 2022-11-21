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
import com.becon.opencelium.backend.utility.PathUtility;
import com.becon.opencelium.backend.utility.Xml;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping(value = "/api/invoker", produces = "application/hal+json", consumes = {"application/json"})
public class InvokerController {

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private InvokerContainer invokerContainer;

    @GetMapping("/{name}")
    public ResponseEntity<?> get(@PathVariable String name) throws Exception {
        InvokerResource invokerResources = invokerService.toResource(invokerService.findByName(name));
        return ResponseEntity.ok(invokerResources);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() throws Exception {

        List<InvokerResource> invokerResources = invokerService.findAll()
                .stream().map(inv -> invokerService.toResource(inv))
                .collect(Collectors.toList());

        final CollectionModel<InvokerResource> resources = CollectionModel.of(invokerResources);
        return ResponseEntity.ok(resources);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody InvokerXMLResource invokerXMLResource)  {
        Document doc = convertStringToXMLDocument(invokerXMLResource.getXml());
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
            String invoker = FilenameUtils.removeExtension(f.getName());
            invoker = invoker.replace("%20", " ");
            container.put(invoker, parser.parse());
        });
        invokerContainer.updateAll(container);

        Invoker invoker = invokerContainer.getByName(filename);
        InvokerResource invokerResource = invokerService.toResource(invoker);
        final EntityModel<InvokerResource> resource = EntityModel.of(invokerResource);
        return ResponseEntity.ok().body(resource);
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> delete(@PathVariable String name){
        invokerService.delete(name);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> deleteInvokerByNameIn(@RequestBody List<String> invokerNames){
        invokerNames.forEach(name -> {
            invokerService.delete(name);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{invokerName}/xml")
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
