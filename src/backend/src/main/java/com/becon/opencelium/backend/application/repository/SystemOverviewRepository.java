package com.becon.opencelium.backend.application.repository;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.elasticsearch.action.admin.cluster.node.info.NodeInfo;
import org.elasticsearch.action.admin.cluster.node.info.NodesInfoResponse;
import org.elasticsearch.client.Client;
import org.neo4j.driver.v1.Driver;
import org.neo4j.driver.v1.Session;
import org.neo4j.ogm.model.Result;
import org.neo4j.ogm.session.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Component
public class SystemOverviewRepository {


    @Autowired
    private DataSource dataSource;

    @Autowired
    private SessionFactory sessionFactory;

    @Autowired
    private Client client;

    @Autowired
    private RestTemplate restTemplate;

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


        // get neo4j version
        try {
            Result result = sessionFactory.openSession()
                    .query("call dbms.components() yield versions unwind versions as version return version;",  new HashMap<String, Object>());
            while (result.iterator().hasNext()) {
                Map<String, Object> map = result.iterator().next();
                if (map.containsKey("version")) {
                    systemOverview.setNeo4j((String) map.get("version"));
                    break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            systemOverview.setNeo4j("Service is down. Unable to detect version. ");
        }

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

    public String getVersion() {
        try	{
            FileRepositoryBuilder builder = new FileRepositoryBuilder();
            Repository repository = builder
                    .readEnvironment()
                    .findGitDir()
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

    // Kibana getting request
//    private ResponseEntity<String> getRestResponse(String host, String port, String httpMethod) throws Exception {
//        HttpEntity<Object> httpEntity = new HttpEntity <Object> (data, header);
//        return restTemplate.exchange(host, httpMethod ,httpEntity, String.class);
//    }
}
