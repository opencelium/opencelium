package com.becon.opencelium.backend.versionmanager.base;

import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.Comparator;

/**
 * Versions at which an entity updater can be selected. A release only needs its own entry when it
 * changes the stored format; any newer release resolves to the latest entry via {@link #latestUpTo}.
 */
public enum UpdaterVersion {

    NO_VERSION("-1"), // default
    VERSION_4_0("4.0"),
    VERSION_4_4("4.4"),
    VERSION_4_5("4.5"),
    VERSION_4_6("4.6"),
    VERSION_4_8("4.8"),
    VERSION_5_0("5.0"),
    VERSION_5_1("5.1"),
    VERSION_5_2("5.2");

    private final String version;

    /**
     * Returns the newest entry that is not newer than {@code version}, e.g. {@code "5.3"} and
     * {@code "5.2.1"} both resolve to {@link #VERSION_5_2}. Requiring an exact or prefix match would
     * silently disable every updater on a release without its own entry.
     *
     * @return {@link #NO_VERSION} when {@code version} is blank, unparsable or older than every entry
     */
    public static UpdaterVersion latestUpTo(final String version) {
        if (StringUtils.isBlank(version)) {
            return NO_VERSION;
        }

        return Arrays.stream(values())
                .filter(v -> v != NO_VERSION)
                .filter(v -> Utils.compare(v.getVersion(), version) <= 0)
                .max(Comparator.comparing(UpdaterVersion::getVersion, Utils::compare))
                .orElse(NO_VERSION);
    }

    UpdaterVersion(String version) {
        this.version = version;
    }

    public String getVersion() {
        return version;
    }
}
