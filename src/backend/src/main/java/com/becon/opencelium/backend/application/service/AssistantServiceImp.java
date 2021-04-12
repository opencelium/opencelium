package com.becon.opencelium.backend.application.service;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.application.repository.SystemOverviewRepository;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.relation.LinkRelation;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.EnhancementNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.LinkRelationServiceImp;
import com.becon.opencelium.backend.resource.application.SystemOverviewResource;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.jayway.jsonpath.JsonPath;
import org.eclipse.jgit.api.Git;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resource;
import org.springframework.stereotype.Service;
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
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;


@Service
public class AssistantServiceImp implements ApplicationService {

    @Autowired
    private SystemOverviewRepository systemOverviewRepository;

    @Override
    public SystemOverview getSystemOverview() {
        return systemOverviewRepository.getCurrentOverview();
    }

    @Override
    public Path uploadZipFile(MultipartFile file, String location) {
        String filename = file.getOriginalFilename();
        Path source = Paths.get(location);
        Path target = source.resolve(filename);
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
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target,
                        StandardCopyOption.REPLACE_EXISTING);
            }
        }
        catch (IOException e) {
            e.printStackTrace();
            throw new StorageException("Failed to store file " + filename, e);
        }

        return target;
    }



    @Override
    public void deleteZipFile(Path path) {
        if(path.equals("")){
            return;
        }
        try {
            File tempFile = new File(path.toString());
            if(tempFile.exists()){
                Files.delete(path);
            }
        }
        catch (IOException e){
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    @Override
    public SystemOverviewResource toResource(SystemOverview systemOverview) {
        SystemOverviewResource systemOverviewResource = new SystemOverviewResource();
        systemOverviewResource.setJava(systemOverview.getJava());
        systemOverviewResource.setOc(systemOverview.getOs());
        systemOverviewResource.setElasticSearch(systemOverview.getElasticSearch());
        systemOverviewResource.setKibana(systemOverview.getKibana());
        systemOverviewResource.setMariadb(systemOverview.getMariadb());
        systemOverviewResource.setNeo4j(systemOverview.getNeo4j());
        return systemOverviewResource;
    }

    @Override
    public void createTmpDir(String dir) {
        Path filePath = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/");
        if (Files.notExists(filePath)){
            File directory = new File(PathConstant.ASSISTANT + "temporary/" + dir + "/");
            directory.mkdir();
            System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/" + dir + "/");
        }

        List<String> folders = Arrays.asList("connection/", "template/", "invoker/");
        folders.forEach(f -> {
            Path path = Paths.get(PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
            if (Files.notExists(path)){
                File directory = new File(PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
                directory.mkdir();
                System.out.println("Directory has been created: " + PathConstant.ASSISTANT + "temporary/" + dir + "/" + f);
            }
        });

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
        } catch (TransformerException ex){
            throw new RuntimeException(ex);
        }
    }

    public void saveTmpJSON(String template, String dir) {
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

    @Override
    public void updateOn() throws Exception {
//        FileRepositoryBuilder builder = new FileRepositoryBuilder();
//        Repository
//        Git git = new Git();
        Git.cloneRepository()
                .setURI("https://api.bitbucket.org/2.0/repositories/becon_gmbh/opencelium")
                .setDirectory(new File("/path/to/targetdirectory"))
                .setBranchesToClone(Arrays.asList("refs/heads/specific-branch"))
                .setBranch("refs/heads/specific-branch")
                .call();
    }

    @Override
    public void updateOff(String dir) throws Exception {
        String path = PathConstant.ASSISTANT + "application/" + dir + "/";
        Git.cloneRepository()
                .setURI(path)
                .setDirectory(new File("/"))
                .setBranchesToClone(Arrays.asList("dev"))
                .setBranch("dev")
                .call();
    }

    public void moveFiles(String fromDir, String toDir) {
        Path result = null;
        try {
            result = Files.move(Paths.get(fromDir), Paths.get(toDir), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            System.out.println("Exception while moving file: " + e.getMessage());
        }
        if(result != null) {
            System.out.println("File moved successfully.");
        }else{
            System.out.println("File movement failed.");
        }
    }

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private EnhancementServiceImp enhancementService;

    @Autowired
    private EnhancementNodeServiceImp enhancementNodeService;

    @Autowired
    private LinkRelationServiceImp linkRelationService;

    @Autowired
    private ValidationContext validationContext;

    @Override
    public void updateConnection(ConnectionResource connectionResource) {
        Connection connection = connectionService.toEntity(connectionResource);
        if (connectionService.existsByName(connection.getName())){
            throw new RuntimeException("CONNECTION_NAME_ALREADY_EXISTS");
        }
        Long connectionId = 0L;
        try {
            connectionService.save(connection);
            connectionId = connection.getId();

            connectionResource.setConnectionId(connection.getId());
            ConnectionNode connectionNode = connectionNodeService.toEntity(connectionResource);
            connectionNodeService.save(connectionNode);

            if (connectionResource.getFieldBinding() != null){
                if (connectionResource.getFieldBinding().isEmpty()){
                    final Resource<ConnectionResource> resource = new Resource<>(connectionService.toNodeResource(connection));
                    return;
                }

                List<EnhancementNode> enhancementNodes =  connectionNodeService
                        .buildEnhancementNodes(connectionResource.getFieldBinding(), connection);
                enhancementNodeService.saveAll(enhancementNodes);

                List<LinkRelation> linkRelations = linkRelationService
                        .toEntity(connectionResource.getFieldBinding(), connection);
                if (linkRelations != null && !linkRelations.isEmpty()){
                    linkRelationService.saveAll(linkRelations);
                }
            }

            final Resource<ConnectionResource> resource = new Resource<>(connectionService.toNodeResource(connection));
            validationContext.remove(connection.getName());
        } catch (Exception e) {
            e.printStackTrace();
            enhancementService.deleteAllByConnectionId(connectionId);
            connectionService.deleteById(connectionId);
            connectionNodeService.deleteById(connectionId);
            validationContext.remove(connection.getName());
        }
    }

    public void runScript(){
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

    public Path unzipFolder(Path source, Path target) throws IOException {

        String os = System.getProperty("os.name");
        if (os.contains("Windows")) {
            String fileZip = source.toString();
            File destDir = new File(target.toString());
            byte[] buffer = new byte[1024];
            ZipInputStream zis = new ZipInputStream(new FileInputStream(fileZip));
            ZipEntry zipEntry = zis.getNextEntry();
            Path folder = zipSlipProtect(zipEntry, target);
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
            try (ZipInputStream zis = new ZipInputStream(new FileInputStream(source.toFile()))) {

                ZipEntry zipEntry = zis.getNextEntry();
                Path folder = zipSlipProtect(zipEntry, target);
                while (zipEntry != null) {

                    boolean isDirectory = false;
                    if (zipEntry.getName().endsWith(File.separator)) {
                        isDirectory = true;
                    }

                    Path newPath = zipSlipProtect(zipEntry, target);

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
                return folder;
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
}
