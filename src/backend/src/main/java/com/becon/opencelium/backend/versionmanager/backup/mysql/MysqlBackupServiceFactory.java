package com.becon.opencelium.backend.versionmanager.backup.mysql;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
public class MysqlBackupServiceFactory {
    private final List<MysqlBackupService> mysqlBackupServices;

    public MysqlBackupServiceFactory(List<MysqlBackupService> mysqlBackupServices) {
        this.mysqlBackupServices = mysqlBackupServices;
    }

    public MysqlBackupService resolve(MysqlBackupType mysqlBackupType) {
        return mysqlBackupServices.stream()
                .filter(x -> Objects.equals(x.getType(), mysqlBackupType))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("mysql backup service not found"));
    }
}
