package com.becon.opencelium.backend.versionmanager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

@Component
public class Connection48MngUpdater implements ConnectionMngUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_8;
    private final EnhancementService enhancementService;
    private final Connection46MngUpdater connection46MngUpdater;

    public Connection48MngUpdater(EnhancementService enhancementService, Connection46MngUpdater connection46MngUpdater) {
        this.enhancementService = enhancementService;
        this.connection46MngUpdater = connection46MngUpdater;
    }

    @Override
    public Wrapper<ConnectionMng> updateToCurrentVersion(ConnectionMng connection) {
        return updateFromInternal(connection, connection.getVersion());
    }

    @Override
    public Wrapper<ConnectionMng> updateFrom(ConnectionMng connection, String oldVersion) {
        return updateFromInternal(connection, oldVersion);
    }

    private Wrapper<ConnectionMng> updateFromInternal(ConnectionMng connection, String oldVersion) {
        if (Objects.isNull(connection) || Utils.compare(currentVersion.getVersion(), oldVersion) < 0)
            return Wrapper.notUpdated(connection);

        if (Utils.compare(oldVersion, UpdaterVersion.VERSION_4_6.getVersion()) < 0) {
            Wrapper<ConnectionMng> updatedTo4_6 = connection46MngUpdater.updateFrom(connection, oldVersion);

            return updateFromGreaterThan4_6(updatedTo4_6.getData(), oldVersion);
        }

        return updateFromGreaterThan4_6(connection, oldVersion);
    }

    private Wrapper<ConnectionMng> updateFromGreaterThan4_6(ConnectionMng connection, String oldVersion) {
        connection.setVersion(currentVersion.getVersion());

        moveMethods(connection);

        moveOperators(connection);

        moveFieldBindings(connection);

        fillEnhancements(connection);

        return Wrapper.updated(connection)
                .changed(true)
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }

    private void moveFieldBindings(ConnectionMng connection) {
        if (CollectionUtils.isNotEmpty(connection.getOldFieldBindings())) {
            connection.setFieldBindings(connection.getOldFieldBindings());
            connection.setOldFieldBindings(null);
        }
    }

    private void moveOperators(ConnectionMng connection) {
        if (connection.getFromConnector() != null) {
            if (CollectionUtils.isNotEmpty(connection.getFromConnector().getOldOperators())) {
                connection.getFromConnector().setOperators(connection.getFromConnector().getOldOperators());
                connection.getFromConnector().setOldOperators(null);
            }
        }

        if (connection.getToConnector() != null) {
            if (CollectionUtils.isNotEmpty(connection.getToConnector().getOldOperators())) {
                connection.getToConnector().setOperators(connection.getToConnector().getOldOperators());
                connection.getToConnector().setOldOperators(null);
            }
        }
    }

    private void moveMethods(ConnectionMng connection) {
        if (connection.getFromConnector() != null) {
            if (CollectionUtils.isNotEmpty(connection.getFromConnector().getOldMethods())) {
                connection.getFromConnector().setMethods(connection.getFromConnector().getOldMethods());
                connection.getFromConnector().setOldMethods(null);
            }
        }

        if (connection.getToConnector() != null) {
            if (CollectionUtils.isNotEmpty(connection.getToConnector().getOldMethods())) {
                connection.getToConnector().setMethods(connection.getToConnector().getOldMethods());
                connection.getToConnector().setOldMethods(null);
            }
        }
    }

    private void fillEnhancements(ConnectionMng connection) {
        if (connection.getFieldBindings() != null) {
            for (FieldBindingMng fb : connection.getFieldBindings()) {
                if (isEnhancementEmpty(fb) && fb.getEnhancementId() != null) {
                    Optional<Enhancement> existingEnhancement = enhancementService.findById(fb.getEnhancementId());
                    if (existingEnhancement.isPresent()) {
                        Enhancement enhancement = existingEnhancement.get();

                        EnhancementMng enhancementMng = new EnhancementMng();
                        enhancementMng.setTitle(enhancement.getTitle() == null ? org.apache.commons.lang3.StringUtils.EMPTY : enhancement.getTitle());
                        enhancementMng.setDescription(enhancement.getDescription() == null ? org.apache.commons.lang3.StringUtils.EMPTY : enhancement.getDescription());
                        enhancementMng.setScript(enhancement.getScript());
                        enhancementMng.setArgs(enhancement.getArgs());
                        enhancementMng.setLanguage(enhancement.getLanguage());

                        fb.setEnhancement(enhancementMng);
                    }
                }

                fb.setEnhancementId(null);
            }
        }
    }

    private boolean isEnhancementEmpty(FieldBindingMng fb) {
        EnhancementMng enhancement = fb.getEnhancement();
        return enhancement == null
                || StringUtils.isBlank(enhancement.getTitle())
                && StringUtils.isBlank(enhancement.getDescription())
                && StringUtils.isBlank(enhancement.getScript())
                && StringUtils.isBlank(enhancement.getLanguage())
                && StringUtils.isBlank(enhancement.getArgs());
    }
}
