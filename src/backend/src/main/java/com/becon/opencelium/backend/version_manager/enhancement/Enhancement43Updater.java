package com.becon.opencelium.backend.version_manager.enhancement;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.version_manager.Wrapper;
import com.becon.opencelium.backend.version_manager.base.SuspendException;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Version43Utils;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class Enhancement43Updater implements EnhancementUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_3;

    @Override
    @SuspendException
    public Wrapper<Enhancement> updateToCurrentVersion(Enhancement enhancement) {
        return updateFrom(enhancement, null);
    }

    @Override
    @SuspendException
    public Wrapper<Enhancement> updateFrom(Enhancement enhancement, String oldVersion) {
        if (Objects.equals(currentVersion.getVersion(), oldVersion))
            return Wrapper.notUpdated(enhancement);

        boolean changed = false;
        if (Objects.nonNull(enhancement) && Objects.nonNull(enhancement.getArgs())) {
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
