package com.becon.opencelium.backend.versionmanager.backup.mysql;

public interface MysqlBackupService {
    void backup(String tableName);

    MysqlBackupType getType();
}
