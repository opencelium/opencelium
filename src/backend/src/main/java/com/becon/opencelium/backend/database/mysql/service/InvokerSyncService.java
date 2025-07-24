package com.becon.opencelium.backend.database.mysql.service;

public interface InvokerSyncService {
    boolean isManuallyModified(String invokerName);
    void forceSync(String invokerName);
}
