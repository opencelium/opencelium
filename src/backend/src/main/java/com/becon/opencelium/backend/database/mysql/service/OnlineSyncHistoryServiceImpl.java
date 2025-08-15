package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OnlineSyncHistory;
import com.becon.opencelium.backend.database.mysql.repository.OnlineSyncHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OnlineSyncHistoryServiceImpl implements OnlineSyncHistoryService {
    private final OnlineSyncHistoryRepository repository;
    private static final String DEFAULT_USERNAME = "OC Autosync";

    public OnlineSyncHistoryServiceImpl(OnlineSyncHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void save(String username, String service, List<String> details) {
        OnlineSyncHistory entity = new OnlineSyncHistory();

        entity.setUsername(username);
        entity.setService(service);
        entity.setDetails(String.join(", ", details));

        repository.save(entity);
    }

    @Override
    public void save(String service, List<String> details) {
        save(DEFAULT_USERNAME, service, details);
    }
}
