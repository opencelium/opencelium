package com.becon.opencelium.backend.versionmanager.base;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.template.entity.Template;

import java.util.Arrays;

public enum UpdaterType {

    TEMPLATE(Template.class),
    CONNECTION_MNG(ConnectionMng.class),
    ENHANCEMENT(Enhancement.class);

    private final Class<?> clazz;

    public static UpdaterType getByClass(final Class<?> clazz) {
        return Arrays.stream(values())
                .filter(v -> v.clazz.equals(clazz))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(clazz + " is not updatable class"));
    }

    UpdaterType(Class<?> clazz) {
        this.clazz = clazz;
    }
}
