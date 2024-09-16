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

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.RequestDataService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.becon.opencelium.backend.utility.migrate.ChangeSetDao;
import com.becon.opencelium.backend.utility.migrate.YAMLMigrator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
public class StorageConfiguration {

    private final UserStorageService userStorageService;
    private final ConnectorService connectorService;
    private final InvokerContainer invokerContainer;
    private final RequestDataService requestDataService;
    private final ChangeSetDao changeSetDao;
    private final Environment environment;
    private final SubscriptionService subscriptionService;

    @Autowired
    private ResourceLoader resourceLoader;

    private static final String JAR_PREFIX = "opencelium.backend-";
    private static final String JAR_EXTENSION = ".jar";

    public StorageConfiguration(
            UserStorageService userStorageService,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("requestDataServiceImp") RequestDataService requestDataService,
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            InvokerContainer invokerContainer,
            DataSource dataSource,
            Environment environment
    ) {
        this.userStorageService = userStorageService;
        this.connectorService = connectorService;
        this.invokerContainer = invokerContainer;
        this.requestDataService = requestDataService;
        this.changeSetDao = new ChangeSetDao(dataSource);
        this.environment = environment;
        this.subscriptionService = subscriptionService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void createStorageAfterStartup() {
        // upload freeLicense
        setInitialLicense();

        // creating 'src/main/resources/templates/' directory
        createDirectory(PathConstant.TEMPLATE);
        // creating 'src/main/resources/assistant/' directory
        createDirectory(PathConstant.ASSISTANT);
        // creating 'src/main/resources/assistant/versions/' directory
        createDirectory(PathConstant.ASSISTANT + PathConstant.VERSIONS);
        // creating 'src/main/resources/assistant/temporary/' directory
        createDirectory(PathConstant.ASSISTANT + "temporary/");
//        createDirectory(PathConstant.ASSISTANT + "zipfile/");

        // encryptes raw requestData in db
        requestDataService.prepare();

        // updates requestData's visibility based on required data
        updateVisibility();

        // creates storage for files
        userStorageService.init();

        // saves new changesets
        if (YAMLMigrator.getChangeSetsToSave() != null) {
            changeSetDao.createAll(YAMLMigrator.getChangeSetsToSave());
        }

        // deleting old version zip and jar files
        cleanOldFiles(PathConstant.LIBS, f -> f.isFile() && f.getName().endsWith(JAR_EXTENSION), JAR_PREFIX);
        cleanOldFiles(PathConstant.ASSISTANT + PathConstant.VERSIONS, File::isDirectory, "");
    }

    private void setInitialLicense() {
        try {
            String initLicenseContent = readInitLicense();
            LicenseKey licenseKey = LicenseKeyUtility.decrypt(initLicenseContent);
            Subscription subscription = subscriptionService.buildFromLicenseKey(licenseKey);
            if(!subscriptionService.exists(subscription.getSubId())) {
                subscriptionService.save(subscription);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void cleanOldFiles(String folder, Predicate<File> filter, String prefix) {
        try (Stream<File> files = Files.list(Paths.get(folder)).map(Path::toFile).filter(filter)) {

            Double ocVersion = environment.getProperty("opencelium.version", Double.class, 0.0);
            int intValue = ocVersion.intValue();

            files.filter(f -> !f.getName().startsWith(prefix + intValue + ".")).forEach(f -> {
                if (forceDelete(f)) {
                    System.out.println(f.getAbsolutePath() + " - file/folder is deleted");
                } else {
                    System.out.println(f.getAbsolutePath() + " - file/folder cannot be deleted");
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean forceDelete(File folder) {
        if (folder == null || !folder.exists()) {
            return false;
        }

        if (folder.isDirectory()) {
            String[] entries = folder.list();
            if (entries != null) {
                for (String entry : entries) {
                    File currentFile = new File(folder, entry);
                    if (!forceDelete(currentFile)) {
                        return false;
                    }
                }
            }
        }
        return folder.delete();
    }

    private void updateVisibility() {
        List<Connector> connectors = connectorService.findAll();
        connectors.forEach(c -> {
            List<RequestData> requestData = c.getRequestData();
            if (requestData != null && !requestData.isEmpty()) {
                List<RequiredData> requiredData = invokerContainer.getByName(c.getInvoker()).getRequiredData();
                requestData.forEach(request -> {
                    RequiredData required = requiredData.stream().filter(rq -> rq.getName().equals(request.getField())).findFirst().orElse(null);
                    if (required == null) {
                        return;
                    }
                    request.setVisibility(required.getVisibility());
                });
            }
        });

        connectorService.saveAll(connectors);
    }

    private void createDirectory(String name) {
        Path filePath = Paths.get(name);
        if (Files.notExists(filePath)) {
            File directory = new File(name);
            if (directory.mkdir()) {
                System.out.println("Directory has been created: " + name);
            } else {
                System.out.println("Failed to create directory: " + name);
            }
        }
    }

    public String readInitLicense() throws IOException {
        // Load the file from resources/license/ folder
        Resource resource = resourceLoader.getResource("classpath:license/init-license.txt");

        // Use InputStream to read the content of the file
        InputStream inputStream = resource.getInputStream();

        // Using BufferedReader and InputStreamReader to read the file content
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            // Collect all lines into a single string without adding '\n'
            return reader.lines().collect(Collectors.joining());
        }
    }
}
