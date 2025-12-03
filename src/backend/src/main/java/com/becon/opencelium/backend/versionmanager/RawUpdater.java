package com.becon.opencelium.backend.versionmanager;

public interface RawUpdater<O> {
    O update(byte[] bytes);
}
