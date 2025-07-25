package com.becon.opencelium.backend.database.mysql.service;

public interface InvokerSyncService {
    void update(String invokerName);
    void delete(String invokerName);
    boolean isManuallyModified(String invokerName);
    void forceSync(String invokerName);
}
