package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;

import java.util.Optional;

public interface InvokerSyncService {
    void save(InvokerSync sync);
    void delete(String invokerName);
    Optional<InvokerSync> findByInvokerName(String invokerName);
    boolean hasManualChange(String invokerName);
}
