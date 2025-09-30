package com.becon.opencelium.backend.versionmanager.enhancement;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.becon.opencelium.backend.versionmanager.base.Version43Utils;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class Enhancement44Updater implements EnhancementUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_4;

    @Override
    public Wrapper<Enhancement> updateToCurrentVersion(Enhancement enhancement) {
        return updateFromInternal(enhancement, null);
    }

    @Override
    public Wrapper<Enhancement> updateFrom(Enhancement enhancement, String oldVersion) {
        return updateFromInternal(enhancement, oldVersion);
    }

    private Wrapper<Enhancement> updateFromInternal(Enhancement enhancement, String oldVersion) {
        if (Objects.isNull(enhancement) || Utils.compare(currentVersion.getVersion(), oldVersion) <= 0)
            return Wrapper.notUpdated(enhancement);

        boolean changed = false;
        if (Objects.nonNull(enhancement.getArgs())) {
            String replaced = Version43Utils.updateRef(enhancement.getArgs());
            if (!Objects.equals(replaced, enhancement.getArgs())) {
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
