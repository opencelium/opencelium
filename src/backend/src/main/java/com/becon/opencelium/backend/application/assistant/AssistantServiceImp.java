package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngServiceImp;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.update_assistant.InstallationDTO;
import com.becon.opencelium.backend.resource.update_assistant.Neo4jConfigResource;
import com.becon.opencelium.backend.utility.Neo4jDriverUtility;
import com.becon.opencelium.backend.utility.ZipUtils;
import com.jayway.jsonpath.JsonPath;
import com.mongodb.client.MongoClient;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
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
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;


@Service
public class AssistantServiceImp implements ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AssistantServiceImp.class);
    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @Autowired
    private Environment env;
    @Autowired
    private MongoClient mongoClient;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private YamlPropertiesFactoryBean yamPropsFactory;
    @Autowired
    private ConnectorServiceImp connectorServiceImp;
    @Autowired
    private ConnectionMngServiceImp connectionMngServiceImp;
    @Autowired
    private FieldBindingMngServiceImp fieldBindingMngServiceImp;

    @Override
    public SystemOverview getSystemOverview() {
        return systemOverviewRepository.getCurrentOverview();
    }

    // if directory is not exists function will create;
    @Override
    public Path uploadZipFile(MultipartFile file, Path location) {
        String filename = file.getOriginalFilename();
        Path target = location.resolve(filename);
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file " + filename);
            }
            if (filename.contains("..")) {
                // This is a security check
                throw new StorageException(
                        "Cannot store file with relative path outside current directory "
                                + filename);
            }
            if (!Files.exists(location)) {
                Files.createDirectory(location);
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target,
                        StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            e.printStackTrace();
            throw new StorageException("Failed to store file " + filename, e);
        }

        return target;
    }


    @Override
    public void deleteZipFile(Path path) {
        if (path.equals("")) {
            return;
        }
        try {
            File tempFile = new File(path.toString());
            if (!tempFile.exists()) {
                return;
            }
            Files.walk(path)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        } catch (IOException e) {
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    @Override
    public SystemOverviewResource toResource(SystemOverview systemOverview) {
        SystemOverviewResource systemOverviewResource = new SystemOverviewResource();
        systemOverviewResource.setJava(systemOverview.getJava());
        systemOverviewResource.setOs(systemOverview.getOs());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setMongodb(systemOverview.getMongodb());
        return systemOverviewResource;
    }

    @Override
    public void createTmpDir(String dir) {
        Path filePath = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/");
        if (Files.notExists(filePath)) {
            File directory = new File(PathConstant.ASSISTANT + "temporary/" + dir + "/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/" + dir + "/");
        }

        List<String> folders = Arrays.asList("connection/", "template/", "invoker/");
        folders.forEach(f -> {
            Path path = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
            if (Files.notExists(path)) {
                File directory = new File(PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
                directory.mkdir();
                System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
            }
        });
    }

    // TODO: test
    @Override
    public String getCurrentVersion() {
        return systemOverviewRepository.getCurrentVersionFromDb();
    }

    @Override
    public InstallationDTO getInstallation() {
        String installType;
        if (!env.containsProperty(YamlPropConst.INSTALLATION) &&
                !env.containsProperty(YamlPropConst.INSTALLATION + ".type")) {

            installType = "undefined";
            log.warn("Path " + YamlPropConst.INSTALLATION + ".type not found in application.yml");
        } else {
            installType = env.getProperty(YamlPropConst.INSTALLATION + ".type");
        }
        return new InstallationDTO(installType);
    }

    // dir - assistant/version/{folder}
    public String getVersionFromDir(String pathTodir) {

        try {
            Properties properties = yamPropsFactory.getObject();
            if (Objects.requireNonNull(properties).containsKey("opencelium.version")) {
                return properties.getProperty("opencelium.version");
            }
            return "NOT_SET";
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void moveToTmpFolder(Path filePath, String folder, String fileExtension) throws IOException {
        List<File> templates = Files.list(filePath)
                .filter(Files::isRegularFile)
                .filter(path -> path.toString().endsWith(fileExtension))
                .map(Path::toFile)
                .collect(Collectors.toList());
        templates.forEach(f -> {
            moveFiles(f.getPath(), folder + f.getName());
        });
    }

    public String getVersion(InputStream inputStream) {
        return systemOverviewRepository.getVersionFromStream(inputStream);
    }

    public void saveTmpInvoker(String xmlInvoker, String dir) {
        Document doc = convertStringToXMLDocument(xmlInvoker);
        NodeList nodeList = doc.getChildNodes();
        Node node = nodeList.item(0);
        Node nameNode = node.getChildNodes().item(1);
        String filename = nameNode.getTextContent();

        try {
            TransformerFactory tFactory = TransformerFactory.newInstance();
            Transformer transformer = tFactory.newTransformer();
            DOMSource source = new DOMSource(doc);
            StreamResult result = new StreamResult(new File(PathConstant.ASSISTANT + "temporary/" + dir + "/" + filename + ".xml"));
            transformer.transform(source, result);
        } catch (TransformerException ex) {
            throw new RuntimeException(ex);
        }
    }

    public void saveTmpTemplate(String template, String dir) {
        try {
            String jsonPath = "$.templateId";
            String filename = JsonPath.read(template, jsonPath) + ".json";
            FileWriter jsonTemplate = new FileWriter(PathConstant.ASSISTANT + "temporary/" + dir + "/" + filename);
            jsonTemplate.write(template);
            jsonTemplate.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void saveTmpConnection(String template, String dir) {
        try {
            String jsonPath = "$.connection.connectionId";
            String filename = JsonPath.read(template, jsonPath) + ".json";
            FileWriter jsonTemplate = new FileWriter(PathConstant.ASSISTANT + "temporary/" + dir + "/" + filename);
            jsonTemplate.write(template);
            jsonTemplate.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void updateOn(String version) throws Exception {
//        String path = version.charAt(0) == 'v' ? version.substring(1) : version;
//        String url = "https://packagecloud.io/becon/opencelium/packages/anyfile/" +
//                "oc_" + path + ".zip/download?distro_version_id=230";
////        InputStream inputStream = downloadFile(url);
//        File backendRoot = new File("");
//        Path appRoot = Paths.get(backendRoot.getAbsolutePath()).getParent().getParent();
//        System.out.println(appRoot);
//        unzipFolder(inputStream, appRoot);
//        ZipUtils.extractZip(inputStream, appRoot);
    }



    @Override
    public void updateOff(String dir) throws Exception { // removed version parameter
        dir = PathConstant.ASSISTANT + PathConstant.VERSIONS + dir;
//            InputStream oc = Files.newInputStream(Paths.get(dir));
        File backendRoot = new File("");
        File file = new File(dir);
        File[] dirFiles = file.listFiles();
        File zipFile;
        if (dirFiles != null && dirFiles.length != 0) {
            zipFile = dirFiles[0];
        } else {
            throw new RuntimeException("Zip file in folder \"versions/" + dir + "\" not found.");
        }
        InputStream inputStream = Files.newInputStream(zipFile.toPath());
        Path appRoot = Paths.get(backendRoot.getAbsolutePath()).getParent().getParent();
        System.out.println(zipFile.toPath() + ", " + appRoot);
//        unzipFolder(inputStream, appRoot);
        ZipUtils.extractZip(inputStream, appRoot);
    }

    @Override
    public boolean checkRepoConnection() {
        try {
            String url = "https://api.bitbucket.org/2.0/repositories/becon_gmbh/opencelium/refs/tags";
            HttpMethod method = HttpMethod.GET;
            HttpHeaders header = new HttpHeaders();
            header.set("Content-Type", "application/json");
            HttpEntity<Object> httpEntity = new HttpEntity<Object>(header);
            ResponseEntity<String> response = restTemplate.exchange(url, method, httpEntity, String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void moveFiles(String fromDir, String toDir) {
        Path result = null;
        try {
            result = Files.move(Paths.get(fromDir), Paths.get(toDir), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            System.out.println("Exception while moving file: " + e.getMessage());
        }
        if (result != null) {
            System.out.println("File moved successfully.");
        } else {
            System.out.println("File movement failed.");
        }
    }

    @Override
    public void updateConnection(ConnectionDTO connectionDTO) {

    }

    @Override
    public void restore() {

    }

    private static Document convertStringToXMLDocument(String xmlString) {
        //Parser that produces DOM object trees from XML content
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        //API to obtain DOM Document instance
        DocumentBuilder builder = null;
        try {
            //Create DocumentBuilder with default configuration
            builder = factory.newDocumentBuilder();

            //Parse the content to Document object
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public Path unzipFolder(InputStream inputStream, Path target) throws IOException {
        File f = new File("../frontend");
        FileUtils.deleteDirectory(f);
        String os = System.getProperty("os.name");
        if (os.contains("Windows")) {
            File destDir = new File(target.toString());
            byte[] buffer = new byte[1024];
            ZipInputStream zis = new ZipInputStream(inputStream);
            ZipEntry zipEntry = zis.getNextEntry();

            String rootName = zipEntry.getName();
            String vFolder = zipSlipProtect(zipEntry, target).toString().replace(rootName, "");
            Path folder = Paths.get(vFolder);
            while (zipEntry != null) {
                File newFile = newFile(destDir, zipEntry);
                if (zipEntry.isDirectory()) {
                    if (!newFile.isDirectory() && !newFile.mkdirs()) {
                        throw new IOException("Failed to create directory " + newFile);
                    }
                } else {
                    // fix for Windows-created archives
                    File parent = newFile.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) {
                        throw new IOException("Failed to create directory " + parent);
                    }

                    // write file content
                    FileOutputStream fos = new FileOutputStream(newFile);
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                    fos.close();
                }
                zipEntry = zis.getNextEntry();

            }
            zis.closeEntry();
            zis.close();
            return folder.getParent();
        } else {
            try (ZipInputStream zis = new ZipInputStream(inputStream)) {

                ZipEntry zipEntry = zis.getNextEntry();
                String rootName = zipEntry.getName();
//                Path folder = zipSlipProtect(zipEntry, target);
                while (zipEntry != null) {
                    boolean isDirectory = false;
                    if (zipEntry.getName().endsWith(File.separator)) {
                        isDirectory = true;
                    }

                    String vFolder = zipSlipProtect(zipEntry, target).toString().replace(rootName, "");
                    Path newPath = Paths.get(vFolder);
                    if (isDirectory) {
                        Files.createDirectories(newPath);
                    } else {
                        // example 1.2
                        // some zip stored file path only, need create parent directories
                        // e.g data/folder/file.txt
                        if (newPath.getParent() != null) {
                            if (Files.notExists(newPath.getParent())) {
                                Files.createDirectories(newPath.getParent());
                            }
                        }
                        System.out.println(zipEntry.getName() + ", " + newPath);
                        Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                    }
                    zipEntry = zis.getNextEntry();
                }
                zis.closeEntry();
                zis.close();
                return target;
            }
        }
    }

    private File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
        File destFile = new File(destinationDir, zipEntry.getName());

        String destDirPath = destinationDir.getCanonicalPath();
        String destFilePath = destFile.getCanonicalPath();

        if (!destFilePath.startsWith(destDirPath + File.separator)) {
            throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
        }

        return destFile;
    }

    private Path zipSlipProtect(ZipEntry zipEntry, Path targetDir)
            throws IOException {
        Path targetDirResolved = targetDir.resolve(zipEntry.getName());
        Path normalizePath = targetDirResolved.normalize();
        if (!normalizePath.startsWith(targetDir)) {
            throw new IOException("Bad zip entry: " + zipEntry.getName());
        }

        return normalizePath;
    }

    @Override
    public void doMigrate(Neo4jConfigResource neo4jConfig) {
        try (var driver = GraphDatabase.driver(neo4jConfig.getUrl(), AuthTokens.basic(neo4jConfig.getUsername(), neo4jConfig.getPassword()));
             Session session = driver.session()) {
            driver.verifyConnectivity(); //checking connectivity to neo4j
            log.info("Connection successfully established to neo4j server with this credentials : [url: {}, username: {}, password: {}]", neo4jConfig.getUrl(), neo4jConfig.getUsername(), neo4jConfig.getPassword().replaceAll(".", "*"));

            try {
                mongoClient.listDatabaseNames(); //checking connectivity to mongodb
            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("Failed to connect to mongodb");
            }

            List<Connection> connections = null;
            try {
                connections = connectionService.findAllNotCompleted();
            } catch (Exception e) {
                log.error("Failed to retrieve connections from neo4j", e);
            }

            if (connections.isEmpty()) {
                log.info("No connections to migrate");
                return;
            }
            for (Connection connection : connections) {
                try {
                    //building connection's data from mysql
                    ConnectionMng connectionMng = new ConnectionMng();
                    connectionMng.setConnectionId(connection.getId());
                    Connector from = connectorServiceImp.getById(connection.getFromConnector());
                    Connector to = connectorServiceImp.getById(connection.getToConnector());
                    ConnectorMng fromMng = new ConnectorMng();
                    fromMng.setTitle(from.getTitle());
                    fromMng.setConnectorId(from.getId());
                    ConnectorMng toMng = new ConnectorMng();
                    toMng.setTitle(to.getTitle());
                    toMng.setConnectorId(to.getId());
                    connectionMng.setFromConnector(fromMng);
                    connectionMng.setToConnector(toMng);

                    String cypherQuery = "MATCH p=((:Connection{connectionId:%d})-[*]->()) return p".formatted(connection.getId());
                    Result result = session.run(cypherQuery);

                    if (!result.hasNext()) {
                        log.warn("Connection[name: {}, id: {}] is not found in neo4j", connection.getTitle(), connection.getId());
                        continue;
                    }

                    try {
                        Neo4jDriverUtility.convertResultToConnection(result, connectionMng);
                    } catch (Exception e) {
                        log.error("Cannot convert Connection[name: {}, id: {}] from neo4j. {}", connection.getTitle(), connection.getId(), e.getMessage());
                        e.printStackTrace();
                        continue;
                    }

                    //setting fieldBindings
                    connectionMng.setFieldBindings(fieldBindingMngServiceImp.getAllByConnectionId(connection.getId()));

                    //saving to mongodb
                    connectionMngServiceImp.save(connectionMng);
                    log.info("Connection[name: {}, id: {}] successfully migrated", connection.getTitle(), connection.getId());
                } catch (Exception e) {
                    log.error("Some error occurred during migration of Connection[name: {}, id: {}]", connection.getTitle(), connection.getId());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage());
        }
    }
}
