package com.becon.opencelium.backend.versionmanager.updaters;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.mapper.v5.TemplateV5Mapper;
import com.becon.opencelium.backend.resource.v5.template.TemplateV5;
import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.versionmanager.*;
import com.becon.opencelium.backend.versionmanager.backup.FileBackupManager;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.becon.opencelium.backend.versionmanager.template.Template40Updater;
import com.becon.opencelium.backend.versionmanager.template.Template44Updater;
import com.becon.opencelium.backend.versionmanager.template.TemplateV5Updater;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class TemplateComplexUpdater
        implements ComplexUpdater, EntityUpdater<TemplateV5>, ConvertibleUpdater<Template, TemplateV5>, RawUpdater<TemplateV5> {

    private static final Logger log = LoggerFactory.getLogger(TemplateComplexUpdater.class);
    private final TemplateService templateService;
    private final OpenceliumProps ocProps;
    private final TemplateV5Mapper templateV5Mapper;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HierarchicalVersionUpgrader<Template> v44Upgrader;
    private final HierarchicalVersionUpgrader<TemplateV5> v5Upgrader;

    public TemplateComplexUpdater(
            @Lazy TemplateService templateService,
            OpenceliumProps ocProps,
            TemplateV5Mapper templateV5Mapper,
            Template44Updater template44Updater,
            Template40Updater template40Updater,
            TemplateV5Updater templateV5Updater
    ) {
        this.templateService = templateService;
        this.ocProps = ocProps;
        this.templateV5Mapper = templateV5Mapper;

        this.v44Upgrader = HierarchicalVersionUpgrader.<Template>builder()
                .step("4.0", template40Updater::updateToCurrentVersion)
                .step("4.4", template44Updater::updateToCurrentVersion)
                .build();

        this.v5Upgrader = HierarchicalVersionUpgrader.<TemplateV5>builder()
                .step("5.0", templateV5Updater::updateToCurrentVersion)
                .build();
    }

    @Override
    public void update() {
        List<Template> templates = templateService.findAllLessThanV5();

        for (Template template : templates) {
            try {
                template = v44Upgrader.upgradeFromVersion(template, template.getVersion());

                TemplateV5 templateV5 = templateV5Mapper.toTemplateV5(template);
                templateV5.setVersion(ocProps.getVersion());

                FileBackupManager.doBackup(template, template.getVersion(), ocProps.getVersion());

                templateService.save(templateV5);

                log.info("Template[id={}, name={}] is successfully updated to {} version", template.getTemplateId(), template.getName(), ocProps.getVersion());
            } catch (Exception e) {
                log.error("Failed to update Template[id={}, name={}]", template.getTemplateId(), template.getName(), e);
            }
        }
    }

    @Override
    public TemplateV5 updateAndConvert(Template template) {
        template = v44Upgrader.upgradeFromVersion(template, template.getVersion());

        TemplateV5 templateV5 = templateV5Mapper.toTemplateV5(template);
        templateV5.setVersion(ocProps.getVersion());

        return templateV5;
    }

    @Override
    public TemplateV5 update(byte[] bytes) {
        try {
            Template template = objectMapper.readValue(bytes, Template.class);
            if (Utils.compare(template.getVersion(), "5.0") >= 0) {
                TemplateV5 templateV5 = objectMapper.readValue(bytes, TemplateV5.class);

                return v5Upgrader.upgradeFromVersion(templateV5, "5.0");
            } else {
                return updateAndConvert(template);
            }
        } catch (IOException e) {
            try {
                TemplateV5 templateV5 = objectMapper.readValue(bytes, TemplateV5.class);
                return v5Upgrader.upgradeFromVersion(templateV5, "5.0");
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }
    }

    @Override
    public TemplateV5 updateToCurrentVersion(TemplateV5 data) {
        return updateFrom(data, data.getVersion());
    }

    @Override
    public TemplateV5 updateFrom(TemplateV5 data, String oldVersion) {
        return v5Upgrader.upgradeFromVersion(data, oldVersion);
    }
}
