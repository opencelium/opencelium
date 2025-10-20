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
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.service.*;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.storage.UserStorageService;
import com.becon.opencelium.backend.subscription.quartz.OperationUsageReportJob;
import com.becon.opencelium.backend.subscription.quartz.QuartzCronUpdater;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.utility.migrate.ChangeSetDao;
import com.becon.opencelium.backend.utility.migrate.YAMLMigrator;
import org.quartz.*;
import org.quartz.Scheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ResourceLoader;

import javax.sql.DataSource;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.stream.Stream;

@Configuration
public class StorageConfiguration {

    private static final Logger log = LoggerFactory.getLogger(StorageConfiguration.class);
    private final UserStorageService userStorageService;
    private final ConnectorService connectorService;
    private final InvokerContainer invokerContainer;
    private final RequestDataService requestDataService;
    private final ChangeSetDao changeSetDao;
    private final Environment environment;
    private final SubscriptionService subscriptionService;
    private final ActivationRequestService activationRequestService;
    private final ConnectionService connectionService;
    private final TemplateService templateService;
    private final OpenceliumProps ocProps;

    @Autowired
    private ResourceLoader resourceLoader;
    @Autowired
    private Scheduler quartzScheduler;

    private static final String JAR_PREFIX = "opencelium.backend-";
    private static final String JAR_EXTENSION = ".jar";

    public StorageConfiguration(
            UserStorageService userStorageService,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("requestDataServiceImp") RequestDataService requestDataService,
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService,
            InvokerContainer invokerContainer,
            DataSource dataSource,
            Environment environment,
            ConnectionService connectionService, TemplateService templateService, OpenceliumProps ocProps
    ) {
        this.userStorageService = userStorageService;
        this.connectorService = connectorService;
        this.invokerContainer = invokerContainer;
        this.requestDataService = requestDataService;
        this.changeSetDao = new ChangeSetDao(dataSource);
        this.environment = environment;
        this.subscriptionService = subscriptionService;
        this.activationRequestService = activationRequestService;
        this.connectionService = connectionService;
        this.templateService = templateService;
        this.ocProps = ocProps;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void createStorageAfterStartup() {
        // upload freeLicense
        setInitialLicense();
        // updates report schedule
        updateReportSchedule();
        // creating '/templates' directory
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

        // updates connections and enhancements to current version
        connectionService.updateConnectionsToCurrentVersion();

        // updates templates to the current version
        templateService.updateTemplatesToCurrentVersion();

        // saves new changesets
        if (YAMLMigrator.getChangeSetsToSave() != null) {
            changeSetDao.createAll(YAMLMigrator.getChangeSetsToSave());
        }

        // deleting old version zip and jar files
        cleanOldFiles(PathConstant.LIBS, f -> f.isFile() && f.getName().endsWith(JAR_EXTENSION), JAR_PREFIX);
        cleanOldFiles(PathConstant.ASSISTANT + PathConstant.VERSIONS, File::isDirectory, "");
    }

    private void updateReportSchedule() {
        String cron = "0 0 23 * * ?";
        schedulerReport(cron);
    }
    private void schedulerReport(String cron){
        String triggerName = "operationUsageReportJobTrigger";
        String triggerGroup = "USAGE_REPORT";
        JobKey jobKey = JobKey.jobKey("operationUsageReportJob", triggerGroup);
        TriggerKey triggerKey = TriggerKey.triggerKey(triggerName, triggerGroup);

        try {
            if (quartzScheduler.checkExists(jobKey)) {
                QuartzCronUpdater quartzCronUpdater = new QuartzCronUpdater(quartzScheduler);
                quartzCronUpdater.updateCronExpression(triggerKey.getName(), triggerKey.getGroup(), cron);
                return;
            }

            JobDetail jobDetail = JobBuilder.newJob(OperationUsageReportJob.class)
                    .withIdentity(jobKey)
                    .storeDurably()
                    .build();
            Trigger trigger = TriggerBuilder.newTrigger()
                    .forJob(jobDetail)
                    .withIdentity(triggerKey)
                    .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                    .build();

            quartzScheduler.scheduleJob(jobDetail, trigger);
        } catch (SchedulerException e) {
            throw new RuntimeException(e);
        }
    }

//    private void setReportSchedule() {
//        JobDetail jobDetail = JobBuilder.newJob(OperationUsageReportJob.class)
//                .withIdentity("operationUsageReportJob")
//                .storeDurably()
//                .build();
//
//        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("00 00 23 * * ?");
//        TriggerBuilder.newTrigger()
//                .forJob(jobDetail)
//                .withIdentity("operationUsageReportJobTrigger")
//                .withSchedule(scheduleBuilder)
//                .build();
//    }

    private void setInitialLicense() {
        if (!doesFileExist(PathConstant.LICENSE + "init-license.txt")) {
            return;
        }
        try {
            ActivationRequest ar = activationRequestService.readFreeAR().orElse(null);
            String initLicense = LicenseKeyUtility.readFreeLicense();
            Subscription subscription = subscriptionService.convertToSub(initLicense, ar);
            if (!subscriptionService.exists(subscription.getSubId())) {
                Objects.requireNonNull(ar).setStatus(ActivReqStatus.PROCESSED);
                ar.setActive(true);
                activationRequestService.save(ar);
                subscriptionService.save(subscription);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void cleanOldFiles(String folder, Predicate<File> filter, String prefix) {
        Path path = Paths.get(folder);

        Integer majorVersion = ocProps.majorVersion();
        if (majorVersion == null) {
            // Gracefully ignored cleaning files when the version is not valid

            return;
        }

        if (Files.exists(path) && Files.isDirectory(path)) {
            try (Stream<File> files = Files.list(path).map(Path::toFile).filter(filter)) {


                files.filter(f -> !f.getName().startsWith(prefix + majorVersion + ".")).forEach(f -> {
                    if (forceDelete(f)) {
                        log.info("{} - file/folder is deleted", f.getAbsolutePath());
                    } else {
                        log.warn("{} - file/folder cannot be deleted", f.getAbsolutePath());
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
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
                log.info("Directory has been created: {}", name);
            } else {
                log.warn("Failed to create directory: {}", name);
            }
        }
    }

    private boolean doesFileExist(String filePath) {
        File file = new File(filePath);
        return file.exists() && file.isFile();
    }
}
