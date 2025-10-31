package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.resource.onlinesync.OnlineSyncHistoryDTO;
import com.becon.opencelium.backend.resource.onlinesync.OnlineSyncStatusDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface OnlineSyncHistoryService {
    List<OnlineSyncHistoryDTO> findAll(String user, String service, LocalDateTime startTime, LocalDateTime endTime);
    void save(String username, String service, List<String> details);
    void save(String service, List<String> details);

    OnlineSyncStatusDTO getStatus();
}
