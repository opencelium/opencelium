package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import com.becon.opencelium.backend.database.mysql.entity.OnlineSyncHistory;
import com.becon.opencelium.backend.database.mysql.repository.OnlineSyncHistoryRepository;
import com.becon.opencelium.backend.resource.onlinesync.OnlineSyncHistoryDTO;
import com.becon.opencelium.backend.resource.onlinesync.OnlineSyncStatusDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

@Service
public class OnlineSyncHistoryServiceImpl implements OnlineSyncHistoryService {
    private final OnlineSyncHistoryRepository repository;
    private final OnlineServicesProps onlineServicesProps;
    private static final String DEFAULT_USERNAME = "OC Autosync";

    public OnlineSyncHistoryServiceImpl(OnlineSyncHistoryRepository repository, OnlineServicesProps onlineServicesProps) {
        this.repository = repository;
        this.onlineServicesProps = onlineServicesProps;
    }

    @Override
    public List<OnlineSyncHistoryDTO> findAll(String user, String service, LocalDateTime startTime, LocalDateTime endTime) {
        return repository.filterHistory(user, service, startTime, endTime).stream()
                .map(history -> {
                    OnlineSyncHistoryDTO dto = new OnlineSyncHistoryDTO();

                    dto.setUser(history.getUsername());
                    dto.setService(history.getService());
                    dto.setDetails(history.getDetails());
                    dto.setTimestamp(history.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

                    return dto;
                }).toList();
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

    @Override
    public OnlineSyncStatusDTO getStatus() {
        return OnlineSyncStatusDTO.fromStatus(
                onlineServicesProps.getActive(),
                onlineServicesProps.getInvokerSync() != null ? onlineServicesProps.getInvokerSync().getActive() : false,
                onlineServicesProps.getTemplateSync() != null ? onlineServicesProps.getTemplateSync().getActive() : false
        );
    }
}
