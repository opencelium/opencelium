package com.becon.opencelium.backend.version_manager.enhancement;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Utils;

import java.util.Objects;

public class Enhancement43Updater implements EnhancementUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;

    private static final Enhancement43Updater instance = new Enhancement43Updater();

    public static Enhancement43Updater getInstance() {
        return instance;
    }

    @Override
    public Wrapper<Enhancement> updateToCurrentVersion(Enhancement enhancement) {
        return updateFrom(enhancement, null);
    }

    @Override
    public Wrapper<Enhancement> updateFrom(Enhancement enhancement, String oldVersion) {
        if (Objects.equals(currentVersion.getVersion(), oldVersion))
            return Wrapper.notUpdated(enhancement);

        boolean changed = false;
        if (Objects.nonNull(enhancement) && Objects.nonNull(enhancement.getArgs())) {
            String replaced = Utils.updateRefWith43Version(enhancement.getArgs());
            if (Objects.equals(replaced, enhancement.getArgs())) {
                changed = true;
            }
            enhancement.setArgs(replaced);
        }

        return Wrapper.updated(enhancement)
                .changed(changed)
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }
}
