package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.resource.user.TotpResource;

public interface TotpService {
    boolean isValidTotp(String secret, String code);
    TotpResource getTotpResource(User user);
    void totpAction(int userId, String action);
}