package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;

import java.io.File;

public interface ActivationRequestService {
    ActivationRequest save(ActivationRequest activationRequest);
    boolean verify(ActivationRequest activationRequest, String hmac);
    ActivationRequest generateActivReq();
    void activateTTL(ActivationRequest activationRequest);
    void expireAll();
    ActivationRequest getActiveAR();
    File createFile(String ar, String fileName);
    ActivationRequest findByHmac(String hmac);
}
