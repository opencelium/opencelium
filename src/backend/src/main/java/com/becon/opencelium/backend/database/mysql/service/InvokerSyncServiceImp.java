package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import com.becon.opencelium.backend.database.mysql.repository.InvokerSyncRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InvokerSyncServiceImp implements InvokerSyncService {
    private final InvokerSyncRepository repository;

    public InvokerSyncServiceImp(InvokerSyncRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void save(InvokerSync sync) {
        repository.save(sync);
    }

    @Override
    @Transactional
    public void update(int id, InvokerSync sync) {
        repository.findById(id)
                .ifPresent(entity -> {
                    entity.setInvokerContentHmac(sync.getInvokerContentHmac());
                    entity.setHasManualSync(sync.getHasManualSync());
                });
    }

    @Override
    @Transactional
    public void delete(String invokerName) {
        repository.findByInvokerName(invokerName)
                .ifPresent(repository::delete);
    }

    @Override
    public Optional<InvokerSync> findByInvokerName(String invokerName) {
        return repository.findByInvokerName(invokerName);
    }
}
