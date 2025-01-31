package com.becon.opencelium.backend.version_manager.connectionmng;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.version_manager.EntityUpdater;
import com.becon.opencelium.backend.version_manager.base.DefaultUpdater;
import com.becon.opencelium.backend.version_manager.base.UpdaterVersion;
import com.becon.opencelium.backend.version_manager.base.Utils;
import org.springframework.stereotype.Component;

import java.util.Map;

import static com.becon.opencelium.backend.version_manager.base.Utils.lowerFirstChar;

@Component
public class ConnectionMngUpdaterProvider {

    private final Map<String, ConnectionMngUpdater> connectionMngUpdaters;

    public ConnectionMngUpdaterProvider(Map<String, ConnectionMngUpdater> connectionMngUpdaters) {
        this.connectionMngUpdaters = connectionMngUpdaters;
    }

    public EntityUpdater<ConnectionMng> getUpdater(final UpdaterVersion version) {
        return switch (version) {
            case VERSION_4_3 -> connectionMngUpdaters.get(lowerFirstChar(Connection43MngUpdater.class.getSimpleName()));
            default -> new DefaultUpdater<>();
        };
    }
}
