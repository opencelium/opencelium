package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.ActivationRequestService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.enums.ApiModule;
import com.becon.opencelium.backend.enums.ApiType;
import com.becon.opencelium.backend.factory.RemoteApiFactory;
import com.becon.opencelium.backend.license.ActivationRequestDTO;
import com.becon.opencelium.backend.license.LicenseKey;
import com.becon.opencelium.backend.license.SubsDTO;
import com.becon.opencelium.backend.license.service_portal.Module;
import com.becon.opencelium.backend.license.service_portal.RemoteApi;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.utility.crypto.AESUtility;
import com.becon.opencelium.backend.utility.crypto.HMACUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping(value = "/api/subs")
@Tag(name = "Subscription")
public class SubscriptionController {
    private final SubscriptionService subscriptionService;
    private final ActivationRequestService activationRequestService;
    private final RemoteApi remoteApi;
    private final ActivationRequestMapper activationRequestMapper;

    public SubscriptionController(
            @Qualifier("subscriptionServiceImp") SubscriptionService subscriptionService,
            @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService,
            ActivationRequestMapper activationRequestMapper
    ) {
        this.subscriptionService = subscriptionService;
        this.activationRequestService = activationRequestService;
        this.activationRequestMapper = activationRequestMapper;
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL, ApiModule.LICENSE);
    }

    // -------------------- ONLINE -------------------- //

    @GetMapping(path = "/all")
    public ResponseEntity<String> getAllSubscriptions() {
        Module module = remoteApi.getModule();
        return module.getAllSubs();
    }

    @GetMapping(path = "/connection/check")
    public ResponseEntity<?> checkConnection() {
        return remoteApi.checkConnection();
    }

    @GetMapping(path = "/{subId}")
    public ResponseEntity<String> getSubById(@PathVariable String subId) {
        Module module = remoteApi.getModule();
        return module.getSubById(subId);
    }

    @PostMapping(path = "/{subId}")
    public ResponseEntity<?> createAR(@PathVariable String subId) {
        // generate activationReq object
        ActivationRequest ar = activationRequestService.generateActivReq();
        ActivationRequestDTO dto = activationRequestMapper.toDTO(ar);

        // request Service Portal for a license
        Module module = remoteApi.getModule();
        String encryptedAR = AESUtility.encrypt(dto);

        ResponseEntity<String> response = module.generateLicense(subId, new ByteArrayResource(encryptedAR.getBytes()));
        if (response.getStatusCode().is2xxSuccessful()) {
            String body = response.getBody();
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode node = null;
            try {
                node = objectMapper.readTree(body);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
            String licenseKeyRaw = node.get("activationResponse").asText(null);
            if (licenseKeyRaw == null) {
                throw new RuntimeException("License key is null");
            }

            LicenseKey licenseKey = (LicenseKey) AESUtility.decrypt(licenseKeyRaw, LicenseKey.class);

            activationRequestService.expireAll();
            ar.setStatus(ActivReqStatus.PROCESSED);
            ActivationRequest saved = activationRequestService.save(ar);

            Subscription subscription = subscriptionService.buildFromLicenseKey(licenseKey);
            subscription.setActivationRequest(saved);
            subscriptionService.deactivateAll();
            subscriptionService.save(subscription);

            SubsDTO subsDTO = new SubsDTO();
            subsDTO.setActive(true);
            subsDTO.setSubsId(licenseKey.getSubId());
            subsDTO.setDuration(subsDTO.getDuration());
            subsDTO.setType(licenseKey.getType());
            subsDTO.setStartDate(licenseKey.getStartDate());
            subsDTO.setEndDate(licenseKey.getEndDate());
            subsDTO.setTotalOperationUsage(licenseKey.getOperationUsage());
            subsDTO.setCurrentOperationUsage(0L);

            return ResponseEntity.ok().body(subsDTO);
        } else {
            return response;
        }
    }


    // -------------------- OFFLINE -------------------- //

    @GetMapping("/activation/request/generate")
    public ResponseEntity<Resource> generateActivationRequest() {
        ActivationRequest ar = activationRequestService.generateActivReq();
        ActivationRequestDTO dto = activationRequestMapper.toDTO(ar);
        String encrypted = AESUtility.encrypt(dto);

        ByteArrayResource resource = new ByteArrayResource(encrypted.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=activation-request.txt");
        headers.add(HttpHeaders.CONTENT_TYPE, "text/plain");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(resource.contentLength())
                .body(resource);
    }

    @PostMapping("/activate/license")
    public ResponseEntity<Void> activateLicense(MultipartFile licenseFile) {
        try {
            String content = new String(licenseFile.getBytes(), StandardCharsets.UTF_8);
            LicenseKey licenseKey = (LicenseKey) AESUtility.decrypt(content, LicenseKey.class);
            String hmac = licenseKey.getHmac();
            String subId = licenseKey.getSubId();
            ActivationRequest ar = activationRequestService.getActiveAR();
            if (HMACUtility.verify(ar, hmac)) {
                throw new RuntimeException("License file is not valid");
            } else {
                activationRequestService.expireAll();
                ar.setStatus(ActivReqStatus.PROCESSED);
                ActivationRequest saved = activationRequestService.save(ar);

                Subscription subscription = subscriptionService.buildFromLicenseKey(licenseKey);
                subscription.setActivationRequest(saved);
                subscriptionService.deactivateAll();
                subscriptionService.save(subscription);
            }

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveSubscription() {
        Subscription subscription = subscriptionService.getActiveSubs();
        if (subscription == null) {
            return ResponseEntity.noContent().build();
        }
        String licenseKeyRaw = subscription.getLicenseKey();
        LicenseKey licenseKey = (LicenseKey) AESUtility.decrypt(licenseKeyRaw, LicenseKey.class);

        SubsDTO subsDTO = new SubsDTO();
        subsDTO.setActive(true);
        subsDTO.setSubsId(licenseKey.getSubId());
        subsDTO.setDuration(subsDTO.getDuration());
        subsDTO.setType(licenseKey.getType());
        subsDTO.setStartDate(licenseKey.getStartDate());
        subsDTO.setEndDate(licenseKey.getEndDate());
        subsDTO.setTotalOperationUsage(licenseKey.getOperationUsage());
        subsDTO.setCurrentOperationUsage(0L);
        return ResponseEntity.ok().body(subsDTO);
    }

    @GetMapping("/activation/request")
    public ResponseEntity<ActivationRequestDTO> getActivationRequest() {
        ActivationRequest ar = activationRequestService.generateActivReq();
        ActivationRequestDTO dto = activationRequestMapper.toDTO(ar);
        return ResponseEntity.ok().body(dto);
    }
}
