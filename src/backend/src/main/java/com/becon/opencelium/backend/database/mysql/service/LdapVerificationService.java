package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.resource.LdapConfigDTO;

import java.util.List;

public interface LdapVerificationService {
    List<String> collectMessages(LdapConfigDTO config);
    void showLogs(LdapProperties properties, String username);
}
