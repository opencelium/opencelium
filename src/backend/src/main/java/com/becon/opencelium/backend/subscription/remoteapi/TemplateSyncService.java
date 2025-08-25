package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.configuration.OpenCeliumProps;
import com.becon.opencelium.backend.database.mysql.service.OnlineSyncHistoryService;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.TemplateModule;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.EntityVersionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class TemplateSyncService {
    private final TemplateModule templateModule;
    private final OpenCeliumProps ocProps;
    private final EntityUpdater<Template> templateEntityUpdater;
    private final TemplateService templateService;
    private final OnlineSyncHistoryService onlineSyncHistoryService;
    private final ObjectMapper objectMapper;

    private static final String SERVICE = "Template File";
    private static final Logger logger = LoggerFactory.getLogger(TemplateSyncService.class);


    public TemplateSyncService(
            OpenCeliumProps ocProps,
            EntityVersionManager entityVersionManager,
            TemplateService templateService,
            OnlineSyncHistoryService onlineSyncHistoryService,
            @Qualifier("objectMapper") ObjectMapper objectMapper
    ) {
        this.ocProps = ocProps;
        this.templateEntityUpdater = entityVersionManager.getUpdater(Template.class);
        this.templateService = templateService;
        this.onlineSyncHistoryService = onlineSyncHistoryService;
        this.templateModule = (TemplateModule) RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL).getModule(ApiModule.TEMPLATE);
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void syncTemplates() {
        // load template files as zip from service portal
        byte[] zipBytes = templateModule.getAllTemplateFiles().getBody();
        Objects.requireNonNull(zipBytes);
        List<String> details = new ArrayList<>();

        // update invoker files that have not been modified manually
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry; // = template file
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().endsWith(".json")) {
                    byte[] jsonBytes = zis.readAllBytes();
                    Template template = objectMapper.readValue(jsonBytes, Template.class);

                    try {
                        templateEntityUpdater.updateToCurrentVersion(template)
                            .ifUpdated(x -> {
                                template.setVersion(ocProps.getVersion());
                            });

                        templateService.save(template);
                        details.add(template.getTemplateId() + ".json");
                    } catch (Exception e) {
                        logger.warn("Failed to sync template file: ", e);
                    }
                }
                zis.closeEntry();
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            onlineSyncHistoryService.save(SERVICE, details);
        }
    }
}
