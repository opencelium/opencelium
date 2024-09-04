package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.repository.ActivationRequestRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.utility.MachineUtility;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ActivationRequestServiceImp implements ActivationRequestService {
    private final ActivationRequestRepository activationRequestRepository;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);


    public ActivationRequestServiceImp(ActivationRequestRepository activationRequestRepository) {
        this.activationRequestRepository = activationRequestRepository;
    }

    @Override
    public ActivationRequest save(ActivationRequest activationRequest) {
        activationRequest.generateAndSetHmac();
        return activationRequestRepository.save(activationRequest);
    }

    @Override
    public boolean verify(ActivationRequest activationRequest, String hmac) {
        return activationRequest.verify(hmac);
    }

    @Override
    public ActivationRequest generateActivReq() {
        ActivationRequest ar = new ActivationRequest();
        ar.setId(UUID.randomUUID());
        ar.setMachineUUID(MachineUtility.getMachineUUID());
        ar.setMacAddress(MachineUtility.getMacAddress());
        ar.setProcessorId(MachineUtility.getProcessorId());
        ar.setComputerName(MachineUtility.getComputerName());
        ar.setCreatedAt(Instant.now());
        ar.setStatus(ActivReqStatus.PENDING);
        ar.setTtl(3600);
        ar.generateAndSetHmac();
        return ar;
    }

    @Override
    public void activateTTL(ActivationRequest ar) {
        scheduler.schedule(() -> {
                    ActivationRequest toModify = activationRequestRepository.findById(ar.getId())
                            .orElse(null);
                    if (toModify != null && !toModify.getStatus().equals(ActivReqStatus.PROCESSED)) {
                        toModify.setStatus(ActivReqStatus.EXPIRED);
                        activationRequestRepository.save(toModify);
                    }
                },
                ar.getTtl(),
                TimeUnit.SECONDS);
    }

    @Override
    public void expireAll() {
        activationRequestRepository.expireAllActivationRequests();
    }

    @Override
    public ActivationRequest getActiveAR() {
        return activationRequestRepository.findActiveAR().orElse(null);
    }
}
