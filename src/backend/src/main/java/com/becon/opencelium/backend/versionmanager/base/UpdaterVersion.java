package com.becon.opencelium.backend.versionmanager.base;

import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;

public enum UpdaterVersion {

    NO_VERSION("-1"), // default
    VERSION_4_0("4.0"),
    VERSION_4_4("4.4"),
    VERSION_4_5("4.5"),
    VERSION_4_6("4.6"),
    VERSION_4_8("4.8");

    private final String version;

    public static UpdaterVersion getByVersionOrStartsWith(final String version) {
        if (version == null) return NO_VERSION;

        return Arrays.stream(values())
                .filter(v -> StringUtils.equals(version, v.getVersion()))
                .findFirst()
                .orElseGet(() -> Arrays.stream(values())
                        .filter(v -> version.startsWith(v.getVersion()))
                        .findFirst()
                        .orElse(NO_VERSION));
    }

    UpdaterVersion(String version) {
        this.version = version;
    }

    public String getVersion() {
        return version;
    }
}
