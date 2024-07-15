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

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.WrongEncode;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.parser.InvokerParserImp;
import com.becon.opencelium.backend.resource.application.UpdateInvokerResource;
import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.ReferenceUtility;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class InvokerServiceImp implements InvokerService {

    @Autowired
    private InvokerContainer invokerContainer;

    @Autowired
    private StorageService storageService;

    private final Path filePath = Paths.get(PathConstant.INVOKER);

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
    public boolean existsByFileName(String fileName) {
        String ext = FileNameUtils.getExtension(fileName);
        if (ext == null || ext.isEmpty()) {
            fileName += ".xml";
        }
        Path path = Path.of(PathConstant.INVOKER + fileName);
        return exists(path);
    }

    @Override
    public List<Invoker> findAll() {
        return new ArrayList<>(invokerContainer.getInvokers().values());
    }

    @Override
    public void delete(String name) {
        Objects.requireNonNull(name);
        deleteInvoker(name);
    }

    @Override
    public void deleteInvokerFile(String name) {
        try {
            Path file = findFileByInvokerName(name).toPath();
            if (exists(file)) {
                invokerContainer.remove(name);
                Files.delete(file.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    // Deletes all entries from the database where the invoker is referenced.
//    @Override
//    public void forceDelete(String name) {
//        Objects.requireNonNull(name);
//        Consumer<String> refDeletion = invokerName -> {
////            if (connectorService.existByInvoker(invokerName)) {
////                Connector connector = connectorService.
////                Connection connection = connectionServiceImp.findAllByConnectorId()
////                connectionServiceImp.deleteById();
////                connectorService.deleteByInvoker(invokerName);
////            }
//
//        };
//        deleteInvoker(name, refDeletion);
//    }

    private void deleteInvoker(String name) {
        Objects.requireNonNull(name);
        Invoker backup = invokerContainer.getByName(name);
        if (name.isEmpty()) {
            throw new RuntimeException("INVOKER_NOT_FOUND");
        }
        try {
            Path file = findFileByInvokerName(name).toPath();
            if (exists(file)) {
                invokerContainer.remove(name);
                Files.delete(file.toAbsolutePath());
            }
        } catch (IOException e) {
            invokerContainer.add(backup.getName(), backup);
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    private boolean exists(Path file) {
        File tempFile = new File(file.toString());
        return tempFile.exists();
    }

    @Override
    public DataType findFieldType(String invokerName, String methodName, LinkedList<String> hierarchy) {

        Invoker invoker = findByName(invokerName);

        Optional<FunctionInvoker> functionInvokerOp = invoker
                .getOperations()
                .stream()
                .filter(o -> o.getName().equals(methodName))
                .findFirst();

        if (functionInvokerOp.isEmpty()) {
            return null;
        }
        FunctionInvoker functionInvoker = functionInvokerOp.get();

        Map<String, Object> fields = functionInvoker.getRequest().getBody().getFields();

        return findFieldType(fields, hierarchy);
    }

    private DataType findFieldType(Object field, LinkedList<String> hierarchy) {

        if (field == null) {
            return null;
        }
        if (!hierarchy.isEmpty() && !(field instanceof Map<?, ?> || field instanceof List<?>)) {
            return DataType.UNDEFINED;
        }
        if (hierarchy.isEmpty()) {
            if (field instanceof Map<?, ?>) {
                return DataType.OBJECT;
            }
            if (field instanceof List<?>) {
                return DataType.ARRAY;
            }
            if (field instanceof Boolean) {
                return DataType.BOOLEAN;
            }
            if (field instanceof String) {
                return DataType.STRING;
            }
            if (field instanceof Number) {
                if (field instanceof Long | field instanceof Integer | field instanceof Short) {
                    return DataType.INTEGER;
                }
                return DataType.NUMBER;
            }
        }

        if (field instanceof Map<?, ?> map) {
            if (!map.containsKey(hierarchy.getFirst())) {
                return DataType.UNDEFINED;
//                throw new RuntimeException("Field path is incorrect : " + hierarchy.getFirst());
            }
            Object obj = map.get(hierarchy.pollFirst());
            return findFieldType(obj, hierarchy);
        }

        if (field instanceof List<?> list) {
            int index;
            String idx = hierarchy.pollFirst();
            idx = idx.replaceAll("[\\[|\\]]", "");
            index = Integer.parseInt(idx);
            Object obj = list.get(index);
            return findFieldType(obj, hierarchy);
        }
        return DataType.OBJECT;
    }

    @Override
    public String findFieldByPath(String invokerName, String methodName, String path) {

        path = path.replace("@", "__oc__attributes.");

        String exchangeType = ReferenceUtility.getExchangeType(path);
        String result = ReferenceUtility.getResult(path);

        Invoker invoker = findByName(invokerName);
        FunctionInvoker functionInvoker = invoker.getOperations().stream().filter(o -> o.getName().equals(methodName))
                .findFirst().orElseThrow(() -> new RuntimeException("Method not found in invoker"));

        String format = "";
        Map<String, Object> fields;
        if (exchangeType.equals("response") && result.equals("success")) {
            fields = functionInvoker.getResponse().getSuccess().getBody().getFields();

            if (functionInvoker.getResponse().getSuccess().getBody() != null) {
                format = functionInvoker.getResponse().getSuccess().getBody().getFormat();
            }
        } else if (exchangeType.equals("response") && result.equals("fail")) {
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

        String[] valueParts = ReferenceUtility.splitPaths(path);
        if (format.equals("xml")) {
            String lastElem = valueParts[valueParts.length - 1];
            if (!lastElem.contains("@")) {
                path = path + ".__oc__value";
            }
        }

        Object value = new Object();
        for (String part : valueParts) {
            value = fields.get(part);
            if (value instanceof Map) {
                fields = (Map<String, Object>) value;
            }

            if (value instanceof ArrayList) {
                fields = ((ArrayList<Map<String, Object>>) value).get(0);
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
//        XPath xpath = xpathfactory.newXPath();
//        String xpathQuery = "/invoker/name";
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

        if (!FileNameUtils.getExtension(file.getName()).equals("xml")) {
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
        invokerContainer.add(invoker, parser.parse());
    }

    @Override
    public File findFileByInvokerName(String invokerName) {
        File directory = new File(PathConstant.INVOKER);
        File[] files = directory.listFiles((dir, name) -> name.endsWith(".xml"));

        if (files != null) {
            Optional<File> foundFile = Arrays.stream(files)
                    .filter(file -> hasInvokerName(file, invokerName))
                    .findFirst();

            if (foundFile.isEmpty()) {
                throw new RuntimeException("Invoker " + "'" + invokerName + "' not found.");
            }
            return foundFile.get();
        }
        throw new RuntimeException("Invokers not found.");
    }

    private Boolean hasInvokerName(File file, String nodeName) {
        try {
            String xPathExpr = "/invoker/name";
            String nodeValue = getNodeValue(file, xPathExpr);
            Objects.requireNonNull(nodeValue);
            return nodeValue.equals(nodeName);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String getNodeValue(File xmlFile, String xpathExpression) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(xmlFile);

            XPathFactory xPathFactory = XPathFactory.newInstance();
            XPath xpath = xPathFactory.newXPath();
            XPathExpression expression = xpath.compile(xpathExpression);

            return expression.evaluate(doc);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    private static Document convertStringToXMLDocument(String xmlString) {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = null;
        try {
            builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Object findField(String field, Map<String, Object> body) {

        if (body == null) {
            return null;
        }
        Map<String, Object> fields = new HashMap<>();

        Object r = null;
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String k = entry.getKey();
            Object object = entry.getValue();

            if (k.equals(field)) {
                return object;
            }

            if ((object instanceof HashMap)) {
                r = findField(field, (Map<String, Object>) object);

            } else if (object instanceof ArrayList) {
                if (!((ArrayList) object).isEmpty() && ((ArrayList) object).get(0) instanceof HashMap) {
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
}