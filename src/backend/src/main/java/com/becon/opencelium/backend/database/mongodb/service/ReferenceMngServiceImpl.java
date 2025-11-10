package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ReferenceMng;
import com.becon.opencelium.backend.database.mongodb.repository.ReferenceMngRepository;
import org.springframework.stereotype.Service;

@Service
public class ReferenceMngServiceImpl implements ReferenceMngService {
    private final ReferenceMngRepository referenceMngRepository;

    public ReferenceMngServiceImpl(ReferenceMngRepository referenceMngRepository) {
        this.referenceMngRepository = referenceMngRepository;
    }

    @Override
    public ReferenceMng save(ReferenceMng reference) {
        return referenceMngRepository.save(reference);
    }

    @Override
    public ReferenceMng getById(String id) {
        return referenceMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("REFERENCE_NOT_FOUND"));
    }
}
