package com.becon.opencelium.backend.version_manager.base;

import java.util.Arrays;

public enum UpdaterVersion {

    NO_VERSION("-1"), // default
    VERSION_4_3("4.3");

    private final String version;

    public static UpdaterVersion getVersionOrElseDefault(final String name) {
        return Arrays.stream(values())
                .filter(v -> v.version.equals(name))
                .findFirst()
                .orElse(NO_VERSION);
    }

    UpdaterVersion(String version) {
        this.version = version;
    }

    public String getVersion() {
        return version;
    }
}
