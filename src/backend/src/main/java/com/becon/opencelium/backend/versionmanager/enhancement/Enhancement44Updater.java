package com.becon.opencelium.backend.versionmanager.enhancement;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.becon.opencelium.backend.versionmanager.base.Version43Utils;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class Enhancement44Updater implements EntityUpdater<Enhancement> {

    private static final String currentVersion = "4.4";

    @Override
    public Enhancement updateToCurrentVersion(Enhancement enhancement) {
        return updateFromInternal(enhancement, null);
    }

    @Override
    public Enhancement updateFrom(Enhancement enhancement, String oldVersion) {
        return updateFromInternal(enhancement, oldVersion);
    }

    private Enhancement updateFromInternal(Enhancement enhancement, String oldVersion) {
        if (Objects.isNull(enhancement) || Utils.compare(currentVersion, oldVersion) <= 0)
            return enhancement;

        if (Objects.nonNull(enhancement.getArgs())) {
            String replaced = Version43Utils.updateRef(enhancement.getArgs());
            enhancement.setArgs(replaced);
        }

        return enhancement;
    }
}
