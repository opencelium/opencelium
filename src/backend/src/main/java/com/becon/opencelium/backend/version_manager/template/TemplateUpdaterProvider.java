package com.becon.opencelium.backend.version_manager.template;

import com.becon.opencelium.backend.template.entity.Template;
import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.base.DefaultUpdater;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import org.springframework.stereotype.Component;

import java.util.Map;

import static com.becon.opencelium.backend.version_manager.base.Utils.lowerFirstChar;

@Component
public class TemplateUpdaterProvider {

    private final Map<String, TemplateUpdater> templateUpdaters;

    public TemplateUpdaterProvider(Map<String, TemplateUpdater> templateUpdaters) {
        this.templateUpdaters = templateUpdaters;
    }

    public EntityUpdater<Template> getUpdater(final UpdaterVersion version) {
        return switch (version) {
            case VERSION_4_0 -> templateUpdaters.get(lowerFirstChar(Template40Updater.class.getSimpleName()));
            case VERSION_4_4 -> templateUpdaters.get(lowerFirstChar(Template44Updater.class.getSimpleName()));
            default -> new DefaultUpdater<>();
        };
    }
}