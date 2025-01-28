package com.becon.opencelium.backend.version_manager.base;

import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.Wrapper;

public class DefaultUpdater implements EntityUpdater<Object> {

    private static final DefaultUpdater instance = new DefaultUpdater();

    public static DefaultUpdater getInstance() {
        return instance;
    }

    @Override
    public Wrapper<Object> updateToCurrentVersion(Object data) {
        return Wrapper.notUpdated(data);
    }

    @Override
    public Wrapper<Object> updateFrom(Object data, String oldVersion) {
        return Wrapper.notUpdated(data);
    }
}
