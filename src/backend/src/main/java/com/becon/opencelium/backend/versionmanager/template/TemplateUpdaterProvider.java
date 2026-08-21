package com.becon.opencelium.backend.versionmanager.template;

import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.base.DefaultUpdater;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import org.springframework.stereotype.Component;

import java.util.Map;

import static com.becon.opencelium.backend.versionmanager.base.Utils.lowerFirstChar;

@Component
public class TemplateUpdaterProvider {

    private final Map<String, TemplateUpdater> templateUpdaters;

    public TemplateUpdaterProvider(Map<String, TemplateUpdater> templateUpdaters) {
        this.templateUpdaters = templateUpdaters;
    }

    public EntityUpdater<Template> getUpdater(final UpdaterVersion version) {
        return switch (version) {
            case VERSION_4_0 -> templateUpdaters.get(lowerFirstChar(Template40Updater.class.getSimpleName()));
            case VERSION_4_4, VERSION_4_5, VERSION_4_6, VERSION_4_8 -> templateUpdaters.get(lowerFirstChar(Template44Updater.class.getSimpleName()));
            case VERSION_5_0, VERSION_5_1 -> templateUpdaters.get(lowerFirstChar(Template50Updater.class.getSimpleName()));
            default -> new DefaultUpdater<>();
        };
    }
}