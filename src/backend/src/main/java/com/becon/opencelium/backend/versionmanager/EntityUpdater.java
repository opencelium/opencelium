package com.becon.opencelium.backend.versionmanager;

public interface EntityUpdater<T> {
    Wrapper<T> updateToCurrentVersion(T data);

    Wrapper<T> updateFrom(T data, String oldVersion);
}