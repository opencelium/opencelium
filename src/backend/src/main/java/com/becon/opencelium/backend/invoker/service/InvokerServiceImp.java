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
import com.becon.opencelium.backend.database.mysql.service.InvokerSyncService;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.exception.WrongEncode;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.parser.InvokerParserImp;
import com.becon.opencelium.backend.resource.application.UpdateInvokerResource;
import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.reference.utility.ReferenceUtility;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.InvokerNameUtils;
import com.becon.opencelium.backend.utility.Xml;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class InvokerServiceImp implements InvokerService {

    private static final Logger log = LoggerFactory.getLogger(InvokerServiceImp.class);

    private final InvokerContainer invokerContainer;
    private final InvokerSyncService invokerSyncService;
    private final Path filePath;

    @Autowired
    public InvokerServiceImp(@Lazy InvokerContainer invokerContainer, @Lazy @Qualifier("invokerSyncServiceImp") InvokerSyncService invokerSyncService) {
        this.invokerContainer = invokerContainer;
        this.invokerSyncService = invokerSyncService;
        this.filePath = Paths.get(PathConstant.INVOKER);
    }

    // Visible for testing: points the service at a temporary invoker directory.
    public InvokerServiceImp(InvokerContainer invokerContainer, InvokerSyncService invokerSyncService, Path filePath) {
        this.invokerContainer = invokerContainer;
        this.invokerSyncService = invokerSyncService;
        this.filePath = filePath;
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

    /**
     * An invoker is always stored as '<name>.xml', so the file name is matched as given -
     * only case-insensitively, because on a case-insensitive file system (APFS, NTFS) writing
     * 'Jira.xml' next to an existing 'jira.xml' silently overwrites it.
     */
    @Override
    public boolean existsByFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return false;
        }
        File[] files = filePath.toFile().listFiles();
        if (files == null) {
            return false;
        }
        return Arrays.stream(files).anyMatch(file -> file.getName().equalsIgnoreCase(fileName));
    }

    @Override
    public List<Invoker> findAll() {
        return new ArrayList<>(invokerContainer.getInvokers().values());
    }

    @Override
    public void delete(String name) {
        Objects.requireNonNull(name);
        deleteInvoker(name);

        // delete invoker sync record
        invokerSyncService.delete(name);
    }

    @Override
    public void deleteInvokerFile(String name) {
        // Delete the file first: if the OS refuses (e.g. the file is locked on Windows),
        // the container keeps the invoker so the UI stays consistent with the disk.
        findInvokerFile(name).ifPresent(file -> {
            try {
                Files.deleteIfExists(file.toPath().toAbsolutePath());
            } catch (IOException e) {
                throw new StorageException(
                        "Failed to delete invoker file '" + file.getName() + "': " + e.getMessage(), e);
            }
        });
        invokerContainer.remove(name);
        invokerSyncService.delete(name);
    }

    @Override
    public void refresh() {
        List<Document> invokers = getAllInvokerDocuments();
        Map<String, Invoker> container = containerize(invokers);
        invokerContainer.updateAll(container);
    }

    @Override
    public List<Invoker> synchronise() {
        refresh();
        return findAll();
    }

    @Override
    public void moveInvokersToNewLocation(String oldPath, String newPath) {
        List<Path> oldInvokers = getAllPaths(oldPath);

        Path targetPath = Paths.get(newPath);
        if (Files.exists(targetPath)) {
            targetPath.toFile().mkdirs();
        }

        oldInvokers.forEach(x -> {
            try {
                Files.move(
                        x,
                        targetPath.resolve(x.getFileName()),
                        StandardCopyOption.REPLACE_EXISTING
                );
            } catch (IOException e) {
                log.error("Failed to move {} file from {} to {}", x, oldPath, newPath);
                throw new RuntimeException(e);
            }
        });

        try {
            Files.deleteIfExists(Path.of(oldPath));
        } catch (IOException e) {
            log.error("Failed to remove folder {}", oldPath);
        }
    }

    @Override
    public Map<String, Invoker> containerize(List<Document> invokers) {
        Map<String, Invoker> container = new HashMap<>();
        invokers.forEach(document -> {
            if (document == null) {
                return;
            }
            InvokerParserImp parser = new InvokerParserImp(document);
//            File f = new File(document.getDocumentURI());
//            String invoker = FileNameUtils.removeExtension(f.getName());
//            invoker = invoker.replace("%20", " ");
            Invoker invoker =  parser.parse();
            String invokerName = invoker.getName();
            container.keySet().stream()
                    .filter(existing -> InvokerNameUtils.sameName(existing, invokerName))
                    .findFirst()
                    .ifPresent(existing -> log.warn(
                            "Invokers '{}' and '{}' differ only in case or in whitespace. "
                                    + "They are treated as one invoker, so only one of them stays reachable.",
                            existing, invokerName));
            container.put(invokerName, invoker);
        });
        return container;
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
    public DataType findFieldType(Invoker invoker, String methodName, LinkedList<String> hierarchy) {

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

        return findFieldType(fields, hierarchy, new ArrayList<>(hierarchy.size()));
    }

    private DataType findFieldType(Object field, LinkedList<String> hierarchy, List<String> seen) {

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
                if (field instanceof Long || field instanceof Integer || field instanceof Short) {
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
            Object obj = map.get(hierarchy.getFirst());
            seen.add(hierarchy.pollFirst());
            return findFieldType(obj, hierarchy, seen);
        }

        if (field instanceof List<?> list) {
            int index;
            String idx = hierarchy.getFirst();
            idx = idx.replaceAll("[\\[|\\]]", "");
            index = Integer.parseInt(idx);
            if (list.isEmpty()) {
                // Primitive array declared as <field name="tests" type="array"/> with no
                // child schema. We can't know the element's type, so report it
                // as undefined instead of failing the whole type resolution.
                return DataType.UNDEFINED;
            }

            if (index >= list.size()) {
//                throw new RuntimeException(
//                        String.format(
//                                "No such element in list. You tried to reference the %s element of the '%s' array, but the array's size is %d in the invoker file. Please ensure the array has at least %s elements or modify the reference path.",
//                                idx,
//                                String.join(".", seen),
//                                list.size(),
//                                idx));
                index = 0; // We have to get first element from invoker array to identify object's structure.
            }

            Object obj = list.get(index);
            seen.set(seen.size() - 1, seen.get(seen.size() - 1) + hierarchy.pollFirst());
            return findFieldType(obj, hierarchy, seen);
        }
        return DataType.OBJECT;
    }

    @Override
    public String findFieldByPath(String invokerName, String methodName, String path) {

        path = path.replace("@", "__oc__attributes.");

        String exchangeType = ReferenceUtility.extractExchangeType(path);
        String result = ReferenceUtility.getResult(path); // TODO: we will not have 'success' or 'fail'

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
        File file = new File(filePath + "/" + name);

        if (!FileNameUtils.getExtension(file.getName()).equals("xml")) {
            return null;
        }
        if (!file.exists()) {
            return null;
        }
        DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        try (InputStream is = new FileInputStream(file)) {
            return dBuilder.parse(is);
        }
    }

    @Override
    public List<Document> getAllInvokerDocuments() {
        try (Stream<Path> allInvokers = Files.walk(filePath, 1)
                .filter(path -> !path.equals(filePath))
                .map(filePath::relativize)) {

            return allInvokers.map(p -> new File(filePath + "/" + p.getFileName()))
                    .filter(f -> f.getName().endsWith(".xml"))
                    .map(file -> {
                        try (InputStream is = new FileInputStream(file)) {
                            DocumentBuilder dBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                            return dBuilder.parse(is);
                        } catch (Exception e) {
                            log.error("Failed to parse Invoker[name: {}]", file.getName());
                            e.printStackTrace();
                            return null;
                        }
                    }).collect(Collectors.toList());
        } catch (IOException e) {
            throw new StorageException("Failed to read stored files", e);
        }
    }

    @Override
    public void save(Document document) {
        InvokerParserImp parser = new InvokerParserImp(document);
        Invoker invoker = parser.parse();
        String invokerName = invoker.getName();
        invokerName = invokerName.replace("%20", " ");
        invokerContainer.add(invokerName, invoker);
    }

    @Override
    public String createInvokerFile(Document document) {
        String name = applyNamePolicy(document);
        String fileName = name + ".xml";

        // The container is keyed by the name each file declares, so a file could still be
        // sitting under this name without the container knowing it.
        if (existsByName(name) || existsByFileName(fileName)) {
            throw new GeneralServiceException(HttpStatus.CONFLICT, "INVOKER_ALREADY_EXISTS",
                    "Invoker '" + name + "' already exists. Invoker names are compared without regard to case.");
        }

        write(document, fileName);
        return name;
    }

    @Override
    public String storeInvokerFile(InputStream inputStream, String fileName) {
        Document document = parse(inputStream, fileName);

        // The name is validated and normalized before the file is written, so that a rejected
        // invoker never leaves a file behind.
        String name = applyNamePolicy(document);
        assertNotStoredInAnotherFile(name, fileName);

        write(document, fileName);
        return name;
    }

    @Override
    public String toStoredFileName(String fileName) {
        Objects.requireNonNull(fileName);
        String baseName = fileName.replace('\\', '/');
        baseName = baseName.substring(baseName.lastIndexOf('/') + 1).trim();

        if (baseName.isEmpty() || baseName.equals(".") || baseName.equals("..")) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_FILE_NAME",
                    "Cannot store invoker file '" + fileName + "': the file name is empty or points outside "
                            + "the invoker folder.");
        }
        if (!"xml".equalsIgnoreCase(FileNameUtils.getExtension(baseName))) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_FILE_NAME",
                    "Invoker file '" + fileName + "' must have the '.xml' extension.");
        }
        return baseName;
    }

    @Override
    public void deleteQuietly(String name) {
        if (name == null) {
            return;
        }
        try {
            delete(name);
        } catch (Exception e) {
            log.warn("Failed to roll back invoker '{}'", name, e);
        }
    }

    /**
     * Validates the name declared in '/invoker/name' against the naming policy and writes the
     * normalized form back, so that the stored file, the name node and the container key all
     * carry the very same value.
     *
     * @return the normalized invoker name
     */
    private String applyNamePolicy(Document document) {
        Node nameNode = findNameNode(document);

        // a document without the node carries no name, which validate() rejects - so once it
        // returns, the node is there to write the normalized name back into
        String name = InvokerNameUtils.validate(nameNode == null ? null : nameNode.getTextContent());
        nameNode.setTextContent(name);
        return name;
    }

    private static Node findNameNode(Document document) {
        try {
            return (Node) XPathFactory.newInstance().newXPath()
                    .compile("/invoker/name").evaluate(document, XPathConstants.NODE);
        } catch (XPathExpressionException e) {
            throw new StorageException("Failed to read the invoker name", e);
        }
    }

    /**
     * Two files declaring the same invoker name would shadow each other in the invoker
     * container, so a file may only be overwritten by the invoker it already carries.
     */
    private void assertNotStoredInAnotherFile(String name, String fileName) {
        if (!existsByName(name)) {
            return;
        }

        String existingFileName;
        try {
            existingFileName = findFileByInvokerName(name).getName();
        } catch (RuntimeException e) {
            // the container knows the invoker but no file declares it any more - nothing to shadow
            log.warn("No file found for invoker '{}' while storing '{}'", name, fileName, e);
            return;
        }

        if (!existingFileName.equalsIgnoreCase(fileName)) {
            throw new GeneralServiceException(HttpStatus.CONFLICT, "INVOKER_ALREADY_EXISTS",
                    "Invoker '" + name + "' is already stored in '" + existingFileName
                            + "'. Invoker names are compared without regard to case.");
        }
    }

    private Document parse(InputStream inputStream, String fileName) {
        try {
            // The stream may be a ZipInputStream sitting on an entry: read the entry's bytes
            // first so that the parser cannot close the archive they belong to.
            byte[] content = inputStream.readAllBytes();
            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            return builder.parse(new ByteArrayInputStream(content));
        } catch (Exception e) {
            throw new StorageException("Failed to read invoker file " + fileName, e);
        }
    }

    /**
     * Serializes the document into the invoker folder and registers the invoker in the container.
     *
     * <p>Serializing goes through {@link Xml#writeTo(Path)} - the same call the upload path uses,
     * so both write invoker files the same way. It wraps the plain identity transformer and owns
     * the output stream, because a handle the transformer leaves open keeps the file locked on
     * Windows until GC. The single-argument {@link Xml} constructor is deliberate: the two-argument
     * one reads the {@code type} attribute off the {@code <invoker>} element and fails on a
     * document that omits it.
     */
    private void write(Document document, String fileName) {
        Path target = filePath.resolve(fileName);
        try {
            document.setDocumentURI(target.toString());
            new Xml(document).writeTo(target);
            save(document);
        } catch (Exception e) {
            throw new StorageException("Failed to store invoker file " + fileName, e);
        }
    }

    @Override
    public File findFileByInvokerName(String invokerName) {
        return findInvokerFile(invokerName)
                .orElseThrow(() -> new RuntimeException("Invoker '" + invokerName + "' not found."));
    }

    private Optional<File> findInvokerFile(String invokerName) {
        File[] files = filePath.toFile().listFiles((dir, name) -> name.endsWith(".xml"));
        if (files == null) {
            return Optional.empty();
        }

        List<File> matches = Arrays.stream(files)
                .filter(file -> hasInvokerName(file, invokerName))
                .sorted(Comparator.comparing(File::getName))
                .toList();

        if (matches.size() > 1) {
            log.warn("Multiple invoker files declare the name '{}': {}. Using '{}'.",
                    invokerName,
                    matches.stream().map(File::getName).collect(Collectors.joining(", ")),
                    matches.get(0).getName());
        }
        return matches.isEmpty() ? Optional.empty() : Optional.of(matches.get(0));
    }

    private Boolean hasInvokerName(File file, String nodeName) {
        try {
            String xPathExpr = "/invoker/name";
            String nodeValue = getNodeValue(file, xPathExpr);
            Objects.requireNonNull(nodeValue);
            return InvokerNameUtils.sameName(nodeValue, nodeName);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String getNodeValue(File xmlFile, String xpathExpression) {
        try (InputStream is = new FileInputStream(xmlFile)) {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(is);

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

    private List<Path> getAllPaths(String folder) {
        if (Files.notExists(Paths.get(folder))) {
            return Collections.emptyList();
        }

        try (Stream<Path> walk = Files.walk(Paths.get(folder))) {
            return walk.filter(Files::isRegularFile)
                    .map(Path::toAbsolutePath)
                    .toList();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}