package com.becon.opencelium.backend.application.repository;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.jayway.jsonpath.JsonPath;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.json.YamlJsonParser;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class SystemOverviewRepository {


    @Autowired
    private DataSource dataSource;

    @Autowired
    private Neo4jClient neo4jClient;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public SystemOverview getCurrentOverview() {
        SystemOverview systemOverview = new SystemOverview();
        systemOverview.setJava(System.getProperty("java.version"));
        systemOverview.setOs(System.getProperty("os.name"));


        // getting MariaDB version
        try {
            String dbVersion = dataSource.getConnection().getMetaData().getDatabaseProductVersion();
            systemOverview.setMariadb(dbVersion);
        } catch (SQLException e){
            e.printStackTrace();
            systemOverview.setMariadb("Service is down. Unable to detect version. ");
        }


//        // get neo4j version
//        try {
//            Result result = neo4jClient
//                    .query("call dbms.components() yield versions unwind versions as version return version;").fetchAs(HashMap<String, Object>.class);
//            while (result.iterator().hasNext()) {
//                Map<String, Object> map = result.iterator().next();
//                if (map.containsKey("version")) {
//                    systemOverview.setNeo4j((String) map.get("version"));
//                    break;
//                }
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//            systemOverview.setNeo4j("Service is down. Unable to detect version. ");
//        }

        // get elasticsearch version
//        try {
//            NodesInfoResponse nodesInfoResponse = client.admin().cluster().prepareNodesInfo().all().execute().actionGet();
//            NodeInfo nodeInfo = nodesInfoResponse.getNodes().stream().findFirst().orElseThrow(() -> new RuntimeException("Node not found"));
//            systemOverview.setElasticSearch(nodeInfo.getVersion().toString());
//        } catch (Exception e) {
//            e.printStackTrace();
//            systemOverview.setElasticSearch("Service is down. Unable to detect version. ");
//        }

        return systemOverview;
    }

    // return current version
    public String getCurrentVersionFromDb() {
        try {
            return jdbcTemplate
                    .queryForList("select AUTHOR from DATABASECHANGELOG order by AUTHOR DESC LIMIT 1", String.class)
                    .get(0);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String getVersionFromGit() {
        try	{
            FileRepositoryBuilder builder = new FileRepositoryBuilder();
            Path path = Paths.get("");
            File workTree = new File(path.toUri()).toPath().getParent().getParent().toFile();
            File gitDir = new File(workTree.getPath() + "/.git");
            Repository repository = builder.setGitDir(gitDir).setWorkTree(workTree)
                    .build();
            Git git = new Git(repository);
            String version = git.describe().call();
            if (version == null) {
                throw new RuntimeException("OC_VERSION_NOT_DETERMINED");
            }
            if (version.length() > 7) {
                version = version.charAt(4) == '-' ? version.substring(0,4) : version.substring(0,6);
            }
            return version;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

    public String getVersionFromStream(InputStream inputStream) {
        try {
            ZipInputStream zis = new ZipInputStream(inputStream);
            ZipEntry zipEntry = zis.getNextEntry();
            byte[] buffer = new byte[1024];
            int read = 0;
            StringBuilder stringBuilder = new StringBuilder();
            while (zipEntry != null) {
                if (zipEntry.getName().contains("backend/src/main/resources/application_default.yml")) {
                    while ((read = zis.read(buffer, 0, 1024)) >= 0) {
                        stringBuilder.append(new String(buffer, 0, read));
                    }
                    ObjectMapper yamlReader = new ObjectMapper();
                    Object obj = yamlReader.readValue(stringBuilder.toString(), Object.class);
                    ObjectMapper jsonReader = new ObjectMapper();
                    String s = jsonReader.writeValueAsString(obj);
                    if (JsonPath.isPathDefinite("$.opencelium.version")) {
                        return JsonPath.read(s, "$.opencelium.version");
                    }
                    return "VERSION_IN_APPLICATION_DEFAULT_NOT_FOUND";
                }
                zipEntry = zis.getNextEntry();
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return "APPLICATION_DEFAULT_NOT_FOUND";
    }

    // Kibana getting request
//    private ResponseEntity<String> getRestResponse(String host, String port, String httpMethod) throws Exception {
//        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
//        return restTemplate.exchange(host, httpMethod ,httpEntity, String.class);
//    }
}
