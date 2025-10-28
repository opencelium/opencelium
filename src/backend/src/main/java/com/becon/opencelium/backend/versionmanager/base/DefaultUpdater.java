package com.becon.opencelium.backend.versionmanager.base;

import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.Wrapper;

public class DefaultUpdater<T> implements EntityUpdater<T> {

    @Override
    public Wrapper<T> updateToCurrentVersion(T data) {
        return Wrapper.notUpdated(data);
    }

    @Override
    public Wrapper<T> updateFrom(T data, String oldVersion) {
        return Wrapper.notUpdated(data);
    }
}
