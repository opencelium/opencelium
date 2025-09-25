package com.becon.opencelium.backend.database.mysql.service;

public interface InvokerSyncService {
    void updateSync(String invokerName);
    void delete(String invokerName);
    boolean isManuallyModified(String invokerName);
    void forceSync(String invokerName);
    void syncInvokers();
}
