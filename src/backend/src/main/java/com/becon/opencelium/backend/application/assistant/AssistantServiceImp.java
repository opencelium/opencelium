package com.becon.opencelium.backend.application.assistant;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngServiceImp;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.database.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.update_assistant.Neo4jConfigResource;
import com.becon.opencelium.backend.utility.Neo4jDriverUtility;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.jayway.jsonpath.JsonPath;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
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
        systemOverviewResource.setElasticSearch(systemOverview.getElasticSearch());
        systemOverviewResource.setKibana(systemOverview.getKibana());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setNeo4j(systemOverview.getNeo4j());
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

    @Override
    public void buildAndRestart() {
        try {
            String target = env.getProperty("opencelium.reboot.path");
            Runtime rt = Runtime.getRuntime();
            Process proc = rt.exec(target);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    // TODO: test
    @Override
    public String getCurrentVersion() {
        return systemOverviewRepository.getCurrentVersionFromDb();
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
        Path path = Paths.get("");
        File workTree = new File(path.toUri()).toPath().getParent().getParent().toFile();
        File gitDir = new File(workTree.getPath() + "/.git");
        Process process = Runtime.getRuntime().exec("git"
                + " --git-dir=" + gitDir + " --work-tree=" + workTree + " fetch --tags");
        getText(process.getInputStream());
        getText(process.getErrorStream());

        process = Runtime.getRuntime().exec("git"
                + " --git-dir=" + gitDir + " --work-tree=" + workTree + " checkout -f tags/" + version);
        getText(process.getInputStream());
        getText(process.getErrorStream());
    }

    public void updateSubsFiles() throws Exception {
        Process process = Runtime.getRuntime().exec("git pull");
        getText(process.getInputStream());
        getText(process.getErrorStream());
    }

    public List<String> getChangedFileName() throws Exception {

        Process fetch = Runtime.getRuntime().exec("git fetch");
        getText(fetch.getInputStream());
        getText(fetch.getErrorStream());

        fetch = Runtime.getRuntime().exec("git diff origin/master --name-only --exit-code");
        getText(fetch.getErrorStream());
        List<String> filesName = getText(fetch.getInputStream());
        return filesName;
    }

    public boolean repoHasChanges() throws Exception {

        Process fetch = Runtime.getRuntime().exec("git fetch");
        getText(fetch.getInputStream());
        getText(fetch.getErrorStream());

        Process diff = Runtime.getRuntime().exec("git diff origin/master --exit-code");
        getText(diff.getErrorStream());
        if (getText(diff.getInputStream()).isEmpty()) {
            return false;
        }
        return true;
    }

    public List<String> getText(InputStream is) {
        List<String> gitText = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is));) {
            String line;
            while ((line = br.readLine()) != null) {
                System.out.println("> " + line);
                gitText.add(line);
            }
        } catch (IOException ioe) {
            ioe.printStackTrace();
        }

        return gitText;
    }

//    public boolean repoVerification() {
//        try {
//            String url = "https://api.bitbucket.org/2.0/repositories/becon_gmbh/opencelium/refs/tags";
//            HttpMethod method = HttpMethod.GET;
//            HttpHeaders header = new HttpHeaders();
//            header.set("Content-Type", "application/json");
//            HttpEntity<Object> httpEntity = new HttpEntity <Object> (header);
//            ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
//            return true;
//        } catch (Exception e) {
//            return false;
//        }
//    }

//    @Override
//    public void  updateOff(String dir) throws Exception { // removed version parameter
////        System.out.println("Offline update run");
////        Path currentRelativePath = Paths.get("");
////        String s = currentRelativePath.toAbsolutePath().toString();
////
////        Path path = Paths.get("");
////        File workTree = new File(path.toUri()).toPath().getParent().getParent().toFile();
////        File gitDir = new File(workTree.getPath() + "/.git");
////        Process process = Runtime.getRuntime().exec("git"
////                + " --git-dir=" + gitDir + " --work-tree=" + workTree + " pull " + s + "/assistant/application/" + dir);
////        getText(process.getInputStream());
////        getText(process.getErrorStream());
////
////        Process process1 = Runtime.getRuntime().exec("git"
////                + " --git-dir=" + gitDir + " --work-tree=" + workTree + "checkout " + version);
////        getText(process1.getInputStream());
////        getText(process1.getErrorStream());
//        dir = PathConstant.ASSISTANT + PathConstant.VERSIONS + dir;
////            InputStream oc = Files.newInputStream(Paths.get(dir));
//        File backendRoot = new File("");
//        Path root = Paths.get(backendRoot.getAbsolutePath()).getParent().getParent();
//        ZipFile zipFile = new ZipFile(dir);
//        Paths.get(dir);
//        File[] files = new File(root.toString()).listFiles();
//        final Stack<String> pathParts = new Stack<String>();
//        {
//            pathParts.push("assistant");
//            pathParts.push("backend");
//            pathParts.push("src");
//        }
//        String appYmlPath = PathConstant.RESOURCES + "application.yml";
//        // move application.yml file to folder that will be not be deleted;
//        moveFiles(appYmlPath, dir);
////        deleteDir(files, pathParts);
//        moveFiles(dir, root.toString());
////            Files.copy(Paths.get(dir), root);
////            unzipFolder(oc, target);
//    }

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
        unzipFolder(inputStream, appRoot);
    }

    private void deleteDir(File[] files, Stack<String> pathParts) {
        try {
            for (File file : files) {
                if (file.isDirectory() && !pathParts.isEmpty() && file.getName().equals(pathParts.peek())) {
                    pathParts.pop();
                    deleteDir(file.listFiles(), pathParts);
                    continue;
                }
                if (file.isDirectory()) {
                    FileUtils.deleteDirectory(file);
                } else {
                    Files.delete(file.toPath());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
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

    public void runScript() {
        final String scriptPath = "/path/to/sh/file";
        String script = "clean.sh";
        try {
            Process awk = new ProcessBuilder("/bin/bash", scriptPath + script).start();
            awk.waitFor();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
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
            driver.verifyConnectivity();
            List<Connection> connections = connectionService.findAllNotCompleted();
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

//                    while (result.hasNext()) {
//                        Record record = result.next();
//                        System.out.println(record.get("p").asPath().end().labels());
//                    }
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
            throw new RuntimeException("Failed to connect to neo4j");
        }
    }
}
