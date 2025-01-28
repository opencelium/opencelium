package com.becon.opencelium.backend.version_manager;

import com.becon.opencelium.backend.configuration.OpenCeliumProps;
import com.becon.opencelium.backend.version_manager.base.EntityUpdaterFactory;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import org.springframework.stereotype.Component;

@Component
public class EntityVersionManager {

    private final UpdaterVersion currentVersion;

    public EntityVersionManager(OpenCeliumProps ocProps) {
        currentVersion = UpdaterVersion.getVersionOrElseDefault(ocProps.getVersion());
    }

    public <T> EntityUpdater<T> getUpdater(Class<T> clazz) {
        return EntityUpdaterFactory.getEntityUpdater(clazz, currentVersion);
    }
}
