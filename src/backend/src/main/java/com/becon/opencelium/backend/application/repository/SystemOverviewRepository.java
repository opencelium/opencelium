package com.becon.opencelium.backend.application.repository;

import com.becon.opencelium.backend.application.entity.SystemOverview;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.PathConstant;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Objects;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class SystemOverviewRepository {

    private final DataSource dataSource;
    private final MongoClient mongoClient;
    private final Environment env;

    public SystemOverviewRepository(DataSource dataSource, Environment environment, MongoClient mongoClient) {
        this.dataSource = dataSource;
        this.mongoClient = mongoClient;
        this.env = environment;
    }

    public SystemOverview getCurrentOverview() {
        SystemOverview systemOverview = new SystemOverview();
        systemOverview.setJava(System.getProperty("java.version"));
        systemOverview.setOs(System.getProperty("os.name"));

        // getting MariaDB version
        try {
            String dbVersion = dataSource.getConnection().getMetaData().getDatabaseProductVersion();
            systemOverview.setMariadb(dbVersion);
        } catch (SQLException e) {
            e.printStackTrace();
            systemOverview.setMariadb("Service is down. Unable to detect version. ");
        }

        //getting mongoDB version
        try {
            MongoDatabase database = mongoClient.getDatabase("admin");
            Document buildInfo = database.runCommand(new Document("buildInfo", 1));
            String mongoVersion = buildInfo.getString("version");
            systemOverview.setMongodb(mongoVersion);
        } catch (Exception e) {
            e.printStackTrace();
            systemOverview.setMongodb("Service is down. Unable to detect version. ");
        }

        return systemOverview;
    }

    // return current version
    public String getCurrentVersion() {
        try {
            return Objects.requireNonNull(env.getProperty(AppYamlPath.OC_VERSION));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String getVersionFromStream(InputStream inputStream) {
        try (ZipInputStream zis = new ZipInputStream(inputStream, StandardCharsets.UTF_8)) {
            ZipEntry zipEntry;
            byte[] buffer = new byte[1024];

            while ((zipEntry = zis.getNextEntry()) != null) {
                try {
                    if (!zipEntry.getName().contains("backend/" + PathConstant.APP_DEFAULT_YML)) {
                        continue;
                    }

                    StringBuilder content = new StringBuilder();
                    int read;

                    while ((read = zis.read(buffer)) != -1) {
                        content.append(new String(buffer, 0, read, StandardCharsets.UTF_8));
                    }

                    String version = extractValueFromYaml(content.toString(), "opencelium.version");

                    return (version == null || version.isBlank())
                            ? "VERSION_IN_APPLICATION_DEFAULT_NOT_FOUND"
                            : version;
                } finally {
                    zis.closeEntry();
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return "APPLICATION_DEFAULT_NOT_FOUND";
    }

    private static String extractValueFromYaml(String yamlContent, String path) {
        YamlPropertiesFactoryBean yamlFactory = new YamlPropertiesFactoryBean();
        Resource resource = new ByteArrayResource(yamlContent.getBytes(StandardCharsets.UTF_8));
        yamlFactory.setResources(resource);

        Properties properties = yamlFactory.getObject();
        return properties == null ? null : properties.getProperty(path);
    }
}
