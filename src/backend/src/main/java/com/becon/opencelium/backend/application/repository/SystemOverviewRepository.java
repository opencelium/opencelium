package com.becon.opencelium.backend.application.repository;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.constant.PathConstant;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class SystemOverviewRepository {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final YamlPropertiesFactoryBean yamlPropertiesFactoryBean;
    private final MongoClient mongoClient;

    public SystemOverviewRepository(DataSource dataSource, JdbcTemplate jdbcTemplate, YamlPropertiesFactoryBean yamlPropertiesFactoryBean, MongoClient mongoClient) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        this.yamlPropertiesFactoryBean = yamlPropertiesFactoryBean;
        this.mongoClient = mongoClient;
    }

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

        //getting mongoDB version
        try {
            MongoDatabase database = mongoClient.getDatabase("admin");
            Document buildInfo = database.runCommand(new Document("buildInfo", 1));
            String mongoVersion = buildInfo.getString("version");
            systemOverview.setMongodb(mongoVersion);
        }catch (Exception e){
            e.printStackTrace();
            systemOverview.setMongodb("Service is down. Unable to detect version. ");
        }

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
                if (zipEntry.getName().contains("backend/" + PathConstant.APP_DEFAULT_YML)) {
                    while ((read = zis.read(buffer, 0, 1024)) >= 0) {
                        stringBuilder.append(new String(buffer, 0, read));
                    }
                    Properties yamlProps = yamlPropertiesFactoryBean.getObject();
                    if (Objects.requireNonNull(yamlProps).containsKey("opencelium.version")) {
                        return yamlProps.getProperty("opencelium.version");
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
