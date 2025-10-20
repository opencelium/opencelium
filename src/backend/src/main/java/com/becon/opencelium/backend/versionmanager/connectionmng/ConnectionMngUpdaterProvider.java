package com.becon.opencelium.backend.versionmanager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.base.DefaultUpdater;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import org.springframework.stereotype.Component;

import java.util.Map;

import static com.becon.opencelium.backend.versionmanager.base.Utils.lowerFirstChar;

@Component
public class ConnectionMngUpdaterProvider {

    private final Map<String, ConnectionMngUpdater> connectionMngUpdaters;

    public ConnectionMngUpdaterProvider(Map<String, ConnectionMngUpdater> connectionMngUpdaters) {
        this.connectionMngUpdaters = connectionMngUpdaters;
    }

    public EntityUpdater<ConnectionMng> getUpdater(final UpdaterVersion version) {
        return switch (version) {
            case VERSION_4_4, VERSION_4_5, VERSION_4_6 -> connectionMngUpdaters.get(lowerFirstChar(Connection44MngUpdater.class.getSimpleName()));
            default -> new DefaultUpdater<>();
        };
    }
}
