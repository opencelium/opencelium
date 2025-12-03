package com.becon.opencelium.backend.versionmanager;

public interface EntityUpdater<T> {
    T updateToCurrentVersion(T data);
    T updateFrom(T data, String oldVersion);
}