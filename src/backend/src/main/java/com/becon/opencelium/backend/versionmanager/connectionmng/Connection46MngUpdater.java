package com.becon.opencelium.backend.versionmanager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.versionmanager.Wrapper;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.UUID;

@Component
public class Connection46MngUpdater implements ConnectionMngUpdater {

    private static final UpdaterVersion currentVersion = UpdaterVersion.VERSION_4_6;
    private final Connection44MngUpdater connection44MngUpdater;

    public Connection46MngUpdater(Connection44MngUpdater connection44MngUpdater) {
        this.connection44MngUpdater = connection44MngUpdater;
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
        if (Objects.isNull(connection) || Utils.compare(currentVersion.getVersion(), oldVersion) <= 0)
            return Wrapper.notUpdated(connection);

        if (Utils.compare(oldVersion, UpdaterVersion.VERSION_4_4.getVersion()) < 0) {
            Wrapper<ConnectionMng> updatedTo4_4 = connection44MngUpdater.updateFrom(connection, oldVersion);

            return updateFromGreaterThan4_4(updatedTo4_4.getData(), oldVersion);
        }

        return updateFromGreaterThan4_4(connection, oldVersion);
    }

    private Wrapper<ConnectionMng> updateFromGreaterThan4_4(ConnectionMng connection, String oldVersion) {

        if (Objects.nonNull(connection.getFromConnector()) && StringUtils.isBlank(connection.getFromConnector().getFlowId())) {
            connection.getFromConnector().setFlowId(UUID.randomUUID().toString());
        }

        if (Objects.nonNull(connection.getToConnector()) && StringUtils.isBlank(connection.getToConnector().getFlowId())) {
            connection.getToConnector().setFlowId(UUID.randomUUID().toString());
        }

        connection.setVersion(currentVersion.getVersion());

        return Wrapper.updated(connection)
                .changed(true)
                .withOldVersion(oldVersion)
                .withNewVersion(currentVersion.getVersion());
    }
}
