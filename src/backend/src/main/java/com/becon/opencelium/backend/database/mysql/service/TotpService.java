package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.resource.user.TotpResource;

public interface TotpService {
    boolean isValidTotp(String secret, String code);
    TotpResource getTotpResource(int userId);
    boolean enableTotp(int id, String code);
    boolean disableTotp(int id, String code);
}