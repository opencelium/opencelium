package com.becon.opencelium.backend.version_manager;

import com.becon.opencelium.backend.configuration.OpenCeliumProps;
import com.becon.opencelium.backend.version_manager.base.UpdaterType;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.connectionmng.ConnectionMngUpdaterProvider;
import com.becon.opencelium.backend.version_manager.enhancement.EnhancementUpdaterProvider;
import com.becon.opencelium.backend.version_manager.template.TemplateUpdaterProvider;
import org.springframework.stereotype.Component;

@Component
public class EntityVersionManager {

    private final UpdaterVersion currentVersion;

    private final ConnectionMngUpdaterProvider connectionMngUpdaterProvider;
    private final TemplateUpdaterProvider templateUpdaterProvider;
    private final EnhancementUpdaterProvider enhancementUpdaterProvider;

    public EntityVersionManager(ConnectionMngUpdaterProvider connectionMngUpdaterProvider, TemplateUpdaterProvider templateUpdaterProvider, EnhancementUpdaterProvider enhancementUpdaterProvider, OpenCeliumProps ocProps) {
        this.connectionMngUpdaterProvider = connectionMngUpdaterProvider;
        this.templateUpdaterProvider = templateUpdaterProvider;
        this.enhancementUpdaterProvider = enhancementUpdaterProvider;
        this.currentVersion = UpdaterVersion.getByVersionOrStartsWith(ocProps.getVersion());
    }

    @SuppressWarnings("unchecked")
    public <T> EntityUpdater<T> getUpdater(Class<T> clazz) {
        return switch (UpdaterType.getByClass(clazz)) {
            case CONNECTION_MNG -> (EntityUpdater<T>) connectionMngUpdaterProvider.getUpdater(currentVersion);
            case ENHANCEMENT -> (EntityUpdater<T>) enhancementUpdaterProvider.getUpdater(currentVersion);
            case TEMPLATE -> (EntityUpdater<T>) templateUpdaterProvider.getUpdater(currentVersion);
        };
    }
}
