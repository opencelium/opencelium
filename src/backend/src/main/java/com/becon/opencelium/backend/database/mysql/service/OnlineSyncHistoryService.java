package com.becon.opencelium.backend.database.mysql.service;

import java.util.List;

public interface OnlineSyncHistoryService {
    void save(String username, String service, List<String> details);
    void save(String service, List<String> details);
}
