package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;

public class ConnectionForGC {
    private Connection connection;
    private ConnectionMng connectionMng;

    public ConnectionForGC(Connection connection, ConnectionMng connectionMng) {
        this.connection = connection;
        this.connectionMng = connectionMng;
    }

    public ConnectionForGC() {
    }

    public ConnectionMng getConnectionMng() {
        return connectionMng;
    }

    public void setConnectionMng(ConnectionMng connectionMng) {
        this.connectionMng = connectionMng;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }
}
