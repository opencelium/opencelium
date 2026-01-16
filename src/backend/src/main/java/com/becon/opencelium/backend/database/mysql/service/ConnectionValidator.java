package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;

public interface ConnectionValidator {
    void validateCreate(Connection connection, ConnectionMng connectionMng);

    void validateUpdate(Connection currCon, Connection newConnection, ConnectionMng newConnectionMng);
}
