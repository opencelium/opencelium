package com.becon.opencelium.backend.versionmanager.enhancement;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.base.DefaultUpdater;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import org.springframework.stereotype.Component;

import java.util.Map;

import static com.becon.opencelium.backend.versionmanager.base.Utils.lowerFirstChar;

@Component
public class EnhancementUpdaterProvider {

    private final Map<String, EnhancementUpdater> enhancementUpdaters;

    public EnhancementUpdaterProvider(Map<String, EnhancementUpdater> enhancementUpdaters) {
        this.enhancementUpdaters = enhancementUpdaters;
    }

    public EntityUpdater<Enhancement> getUpdater(final UpdaterVersion version) {
        return switch (version) {
            case VERSION_4_4, VERSION_4_5 -> enhancementUpdaters.get(lowerFirstChar(Enhancement44Updater.class.getSimpleName()));
            default -> new DefaultUpdater<>();
        };
    }
}