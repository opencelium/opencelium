package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.repository.ActivationRequestRepository;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ActivationRequestServiceImp implements ActivationRequestService{

    private final ActivationRequestRepository activationRequestRepository;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    public ActivationRequestServiceImp(ActivationRequestRepository activationRequestRepository) {
        this.activationRequestRepository = activationRequestRepository;
    }

    @Override
    public ActivationRequest save(ActivationRequest activationRequest) {
        return activationRequestRepository.save(activationRequest);
    }

    @Override
    public boolean verify(ActivationRequest activationRequest, String hmac) {
        return activationRequest.verify(hmac);
    }

    @Override
    public ActivationRequest generateActivReq() {
        ActivationRequest ar = new ActivationRequest();
        ar.setId(UUID.randomUUID().toString());
        ar.setCreatedAt(LocalDateTime.now());
        ar.setStatus(ActivReqStatus.PENDING);
        ar.setTtl(3600);
        ar.setHmac(HmacUtility.encode(ar.getId()+ MachineUtility.getStringForHmacEncode()));
        return ar;
    }

    @Override
    public void activateTTL(ActivationRequest activationRequest) {
        scheduler.schedule(() -> {
                    ActivationRequest toModify = activationRequestRepository.findById(activationRequest.getId())
                            .orElse(null);
                    if (toModify != null && !toModify.getStatus().equals(ActivReqStatus.PROCESSED)) {
                        toModify.setStatus(ActivReqStatus.EXPIRED);
                        activationRequestRepository.save(toModify);
                    }
                },
                activationRequest.getTtl(),
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

    @Override
    public File createFile(String ar, String fileName) {
        try {
            File tempFile = File.createTempFile(fileName, ".txt");
            FileWriter writer = new FileWriter(tempFile);
            writer.write(ar);
            writer.close();
            return tempFile;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public ActivationRequest findByHmac(String hmac) {
        return activationRequestRepository.findFirstByHmac(hmac)
                .orElseThrow(()-> new RuntimeException("Activation Request not found by hmac: " + hmac));
    }

    @Override
    public Optional<ActivationRequest> findById(String id) {
        return activationRequestRepository.findById(id);
    }
}
