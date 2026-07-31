package com.becon.opencelium.backend.versionmanager;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.versionmanager.base.UpdaterType;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.connectionmng.ConnectionMngUpdaterProvider;
import com.becon.opencelium.backend.versionmanager.template.TemplateUpdaterProvider;
import org.springframework.stereotype.Component;

@Component
public class EntityVersionManager {

    private final UpdaterVersion currentVersion;

    private final ConnectionMngUpdaterProvider connectionMngUpdaterProvider;
    private final TemplateUpdaterProvider templateUpdaterProvider;

    public EntityVersionManager(ConnectionMngUpdaterProvider connectionMngUpdaterProvider, TemplateUpdaterProvider templateUpdaterProvider, OpenceliumProps ocProps) {
        this.connectionMngUpdaterProvider = connectionMngUpdaterProvider;
        this.templateUpdaterProvider = templateUpdaterProvider;
        this.currentVersion = UpdaterVersion.getByVersionOrStartsWith(ocProps.getVersion());
    }

    @SuppressWarnings("unchecked")
    public <T> EntityUpdater<T> getUpdater(Class<T> clazz) {
        return switch (UpdaterType.getByClass(clazz)) {
            case CONNECTION_MNG -> (EntityUpdater<T>) connectionMngUpdaterProvider.getUpdater(currentVersion);
            case TEMPLATE -> (EntityUpdater<T>) templateUpdaterProvider.getUpdater(currentVersion);
        };
    }

    @SuppressWarnings("unchecked")
    public <T> EntityUpdater<T> getUpdater(Class<T> clazz, UpdaterVersion maxVersion) {
        return switch (UpdaterType.getByClass(clazz)) {
            case CONNECTION_MNG -> (EntityUpdater<T>) connectionMngUpdaterProvider.getUpdater(maxVersion);
            case TEMPLATE -> (EntityUpdater<T>) templateUpdaterProvider.getUpdater(maxVersion);
        };
    }
}
