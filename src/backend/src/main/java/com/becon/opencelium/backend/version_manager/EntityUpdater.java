package com.becon.opencelium.backend.version_manager;

public interface EntityUpdater<T> {
    Wrapper<T> updateToCurrentVersion(T data);

    Wrapper<T> updateFrom(T data, String oldVersion);
}