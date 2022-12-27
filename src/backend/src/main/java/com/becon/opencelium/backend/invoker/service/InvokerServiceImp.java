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

package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.WrongEncode;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.parser.InvokerParserImp;
import com.becon.opencelium.backend.resource.application.UpdateInvokerResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.*;
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.nio.file.Files.exists;

@Service
public class InvokerServiceImp implements InvokerService {

    @Autowired
    private InvokerContainer invokerContainer;

    @Autowired
    private StorageService storageService;

    private final Path filePath = Paths.get(PathConstant.INVOKER);

    @Override
    public Invoker toEntity(InvokerResource resource) {
//        return new Invoker(resource);
        return null;
    }

    @Override
    public InvokerResource toResource(Invoker entity) {
        return new InvokerResource(entity);
    }

    @Override
    public FunctionInvoker getTestFunction(String invokerName) {
        return invokerContainer.getByName(invokerName).getOperations()
                .stream().filter(f -> f.getType().equals("test"))
                .findFirst().orElse(null);
    }

    @Override
    public FunctionInvoker getAuthFunction(String invokerName) {
        return invokerContainer.getByName(invokerName).getOperations()
                .stream().filter(f -> f.getType().equals("auth"))
                .findFirst().orElse(null);
    }

    @Override
    public List<FunctionInvoker> getAuthFunctions(String invoker) {
        return invokerContainer.getByName(invoker).getOperations()
                .stream().filter(f -> f.getType().contains("auth")).collect(Collectors.toList());
    }

    @Override
    public Invoker findByName(String name) {
        return invokerContainer.getByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return invokerContainer.existsByName(name);
    }

    @Override
    public List<Invoker> findAll() {
        return new ArrayList<>(invokerContainer.getInvokers().values());
    }

    @Override
    public void delete(String name) {
        invokerContainer.remove(name);
        if(name.equals("")){
            throw new RuntimeException("INVOKER_NOT_FOUND");
        }
        String location = "src/backend/src/main/resources/invoker/";
        Path rootLocation = Paths.get(location);
        try {

            Path file = rootLocation.resolve(name + ".xml");
            if(exists(file)){
                Files.delete(file);
            }
        }
        catch (IOException e){
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    private boolean exists(Path file) {
        File tempFile = new File(file.toString());
        return tempFile.exists();
    }

    //TODO: need to add path of field
    @Override
    public String findFieldType(String invokerName, String methodName, String exchangeType, String result, String fieldName) {
        Body body = null;

        if (exchangeType.equals("response") && result.equals("success")){
            body = invokerContainer.getByName(invokerName).getOperations().stream()
                    .filter(o -> o.getName().equals(methodName))
                    .map(o -> o.getResponse().getSuccess().getBody()).findFirst().get();
        } else if (exchangeType.equals("response") && result.equals("fail")){
            body = invokerContainer.getByName(invokerName).getOperations().stream()
                    .filter(o -> o.getName().equals(methodName))
                    .map(o -> o.getResponse().getFail().getBody()).findFirst().get();
        } else if (exchangeType.equals("request")) {
            Invoker invoker = invokerContainer.getByName(invokerName);
            FunctionInvoker functionInvoker = invoker.getOperations().stream()
                    .filter(o -> o.getName().equals(methodName)).findFirst().get();
            body = functionInvoker.getRequest().getBody();
        }

        Object type = findField(fieldName, body.getFields());

        if(type instanceof HashMap){
            return "object";
        } else if (type instanceof ArrayList){
            return "array";
        }
        return "string";
    }

    @Override
    public String findFieldByPath(String invokerName, String methodName, String path)  {

        path = path.replace("@", "__oc__attributes.");

        String exchangeType = ConditionUtility.getExchangeType(path);
        String result = ConditionUtility.getResult(path);

        Invoker invoker = findByName(invokerName);
        FunctionInvoker functionInvoker = invoker.getOperations().stream().filter(o -> o.getName().equals(methodName))
                .findFirst().orElseThrow(() -> new RuntimeException("Method not found in invoker"));

        String format = "";
        Map<String, Object> fields;
        if (exchangeType.equals("response") && result.equals("success")){
            fields = functionInvoker.getResponse().getSuccess().getBody().getFields();

            if (functionInvoker.getResponse().getSuccess().getBody() != null) {
                format = functionInvoker.getResponse().getSuccess().getBody().getFormat();
            }
        } else if (exchangeType.equals("response") && result.equals("fail")){
            fields = functionInvoker.getResponse().getFail().getBody().getFields();
            if (functionInvoker.getResponse().getFail().getBody() != null) {
                format = functionInvoker.getResponse().getFail().getBody().getFormat();
            }
        } else {
            fields = functionInvoker.getRequest().getBody().getFields();
            if (functionInvoker.getRequest().getBody() != null) {
                format = functionInvoker.getRequest().getBody().getFormat();
            }
        }

        String[] valueParts = ConditionUtility.getRefValue(path).split("\\.");
        if (format.equals("xml")) {
            String lastElem = valueParts[valueParts.length -1];
            if (!lastElem.contains("@")) {
                path = path + ".__oc__value";
            }
        }

        Object value = new Object();
        for (String part : valueParts) {
             value = fields.get(part);
             if (value instanceof Map){
                 fields = ( Map<String, Object>) value;
             }

            if (value instanceof ArrayList){
                fields = (( ArrayList<Map<String, Object>>) value).get(0);
            }
        }

        ObjectMapper objectMapper = new ObjectMapper();
        String fieldValue;
        try {
            fieldValue = objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return fieldValue;
    }

    @Override
    public Map<String, String> findAllByPathAsString(String path) {
        return getAll(path);
    }

    @Override
    public UpdateInvokerResource toUpdateInvokerResource(Map.Entry<String, String> entry) {
        UpdateInvokerResource updateInvokerResource = new UpdateInvokerResource();
        XPathFactory xpathfactory = XPathFactory.newInstance();
        XPath xpath = xpathfactory.newXPath();
        String xpathQuery = "/invoker/name";
        String fileName = entry.getKey();
        String inv = entry.getValue();

        updateInvokerResource.setName(fileName);
        updateInvokerResource.setContent(inv);

        return updateInvokerResource;
    }

    @Override
    public Map<String, Invoker> findAllAsMap() {
        return null;
    }

    @Override
    public Document getDocument(String name) throws Exception {
        File file = new File(filePath.toString() + "/" + name);

        if(!FileNameUtils.getExtension(file.getName()).equals("xml")){
            return null;
        }
        DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        return file.exists() ? dBuilder.parse(file) : null;
    }

    @Override
    public void save(Document document) {
        InvokerParserImp parser = new InvokerParserImp(document);
        File f = new File(document.getDocumentURI());
        String invoker = FileNameUtils.removeExtension(f.getName());
        invoker = invoker.replace("%20", " ");
        invokerContainer.update(invoker, parser.parse());
    }

    private static Document convertStringToXMLDocument(String xmlString)
    {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = null;
        try
        {
            builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return null;
    }

    private Object findField(String field, Map<String, Object> body){

        if (body == null) {
            return null;
        }
        Map<String, Object> fields = new HashMap<>();

        Object r = null;
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String k = entry.getKey();
            Object object = entry.getValue();

            if (k.equals(field)){
                return object;
            }

            if((object instanceof HashMap)){
               r = findField(field, (Map<String, Object>) object);

            } else if (object instanceof ArrayList){
               if(!((ArrayList) object).isEmpty() && ((ArrayList) object).get(0) instanceof HashMap){
                    Map<String, Object> subFields = ((ArrayList<Map<String, Object>>) object).get(0);
                    r = findField(field, subFields);

                }
            }

            if (r != null) {
                return r;
            }
        }

        return null;
    }

    private Map<String, String> getAll(String folder) throws WrongEncode {
        try (Stream<Path> walk = Files.walk(Paths.get(folder))) {
            return walk.filter(Files::isRegularFile)
                    .filter(path -> FileNameUtils.getExtension(path.toString()).equals("xml"))
                    .map(path -> {
                        StringBuilder contentBuilder = new StringBuilder();
                        try (Stream<String> stream = Files.lines(Paths.get(path.toString()), StandardCharsets.UTF_8)) {
                            stream.forEach(s -> contentBuilder.append(s).append("\n"));
                            Map.Entry<String, String> entry = Collections
                                    .singletonMap(Paths.get(path.toString()).getFileName().toString(), contentBuilder.toString())
                                    .entrySet().iterator().next();
                            return entry;
                        } catch (Exception e) {
                            e.printStackTrace();
                            throw new WrongEncode("UTF8");
                        }
                    }).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public InvokerResource toMetaResource(Invoker invoker) {
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
        InvokerResource invokerResource = new InvokerResource();
        invokerResource.setName(invoker.getName());
        invokerResource.setDescription(invoker.getDescription());
        invokerResource.setIcon(imagePath + invoker.getIcon());

        return invokerResource;
    }
}