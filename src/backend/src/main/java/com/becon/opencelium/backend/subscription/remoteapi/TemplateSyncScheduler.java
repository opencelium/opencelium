package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.configuration.OpenCeliumProps;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.TemplateModule;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.EntityVersionManager;
import com.becon.opencelium.backend.version_manager.base.Utils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class TemplateSyncScheduler {
    private final TemplateModule templateModule;
    private final OpenCeliumProps ocProps;
    private final EntityUpdater<Template> templateEntityUpdater;
    private final TemplateService templateService;
    private final ObjectMapper objectMapper;

    @Value("${opencelium.online_services.template_sync.active:false}")
    private boolean active;
    private static final Path INVOKER_FILES_PATH = Paths.get(PathConstant.INVOKER);

    public TemplateSyncScheduler(
            OpenCeliumProps ocProps,
            EntityVersionManager entityVersionManager,
            TemplateService templateService,
            @Qualifier("objectMapper") ObjectMapper objectMapper
    ) {
        this.ocProps = ocProps;
        this.templateEntityUpdater = entityVersionManager.getUpdater(Template.class);
        this.templateService = templateService;
        this.templateModule = (TemplateModule) RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL).getModule(ApiModule.TEMPLATE);
        this.objectMapper = objectMapper;
    }

    @Transactional
    @Scheduled(cron = "${opencelium.online_services.template_sync.time}")
    void syncTemplates() {
        if (!active) {
            return;
        }

        // load template files as zip from service portal
        byte[] zipBytes = templateModule.getAllTemplateFiles().getBody();
        Objects.requireNonNull(zipBytes);

        // update invoker files that have not been modified manually
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry; // = template file
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().endsWith(".json")) {
                    // read bytes of template file
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                    }

                    String jsonContent = baos.toString(StandardCharsets.UTF_8);
                    Template template = objectMapper.readValue(jsonContent, Template.class);

                    if (Utils.compare(ocProps.getVersion(), template.getVersion()) > 0) {
                        try {
                            String oldVersion = template.getVersion();
                            templateEntityUpdater.updateToCurrentVersion(template)
                                    .ifUpdated(x -> {
                                        template.setVersion(ocProps.getVersion());
                                        templateService.save(template);
                                    });
                        } catch (Exception e) {
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
