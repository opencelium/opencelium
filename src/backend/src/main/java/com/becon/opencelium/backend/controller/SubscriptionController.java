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
import com.becon.opencelium.backend.license.ActivationRequestResponse;
import com.becon.opencelium.backend.license.LicenseKey;
import com.becon.opencelium.backend.license.SubsDTO;
import com.becon.opencelium.backend.license.service_portal.Module;
import com.becon.opencelium.backend.license.service_portal.RemoteApi;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequesResMapper;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.crypto.Base64Utility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
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
    private final ActivationRequesResMapper activationRequesResMapper;

    public SubscriptionController(
            @Qualifier("subscriptionServiceImp") SubscriptionService subscriptionService,
            @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService,
            ActivationRequestMapper activationRequestMapper,
            ActivationRequesResMapper activationRequesResMapper
    ) {
        this.subscriptionService = subscriptionService;
        this.activationRequestService = activationRequestService;
        this.activationRequestMapper = activationRequestMapper;
        this.activationRequesResMapper = activationRequesResMapper;
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

        // request Service Portal for a license
        Module module = remoteApi.getModule();
        String encryptedAR = Base64Utility.encode(ar);

        ResponseEntity<String> response = module.generateLicense(subId, new ByteArrayResource(encryptedAR.getBytes()));
        if (response.getStatusCode().is2xxSuccessful()) {
            String body = response.getBody();
            String licenseKeyRaw = extractLicenseKey(body);
            LicenseKey licenseKey = LicenseKeyUtility.decrypt(licenseKeyRaw);
            if (licenseKey == null) {
                throw new RuntimeException("Cannot read license key");
            }

            if (!HmacUtility.verify(ar, licenseKey.getHmac())) {
                throw new RuntimeException("License file is not valid");
            }

            activationRequestService.expireAll();
            ar.setStatus(ActivReqStatus.PROCESSED);
            ActivationRequest saved = activationRequestService.save(ar);

            Subscription subscription = subscriptionService.buildFromLicenseKey(licenseKey);
            subscription.setActivationRequest(saved);
            subscriptionService.deactivateAll();
            subscriptionService.save(subscription);

            SubsDTO subsDTO = subscriptionService.toDto(licenseKey, subscription);
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
        String encrypted = Base64Utility.encode(dto);

        ByteArrayResource resource = new ByteArrayResource(encrypted.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=activation-request.txt");
        headers.add(HttpHeaders.CONTENT_TYPE, "text/plain");

        activationRequestService.expireAll();
        activationRequestService.save(ar);
        activationRequestService.activateTTL(ar);

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(resource.contentLength())
                .body(resource);
    }

    @PostMapping("/activate/license")
    public ResponseEntity<?> activateLicense(MultipartFile licenseKey) {
        String content;
        try {
            content = new String(licenseKey.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Cannot read license file");
        }

        LicenseKey lk = LicenseKeyUtility.decrypt(content);
        if (lk == null) {
            throw new RuntimeException("Cannot read license file");
        }
        String hmac = lk.getHmac();
        ActivationRequest ar = activationRequestService.getActiveAR();
        if (!HmacUtility.verify(ar, hmac)) {
            throw new RuntimeException("License file is not valid");
        } else {
            ar.setStatus(ActivReqStatus.PROCESSED);
            ActivationRequest saved = activationRequestService.save(ar);

            Subscription subscription = subscriptionService.buildFromLicenseKey(lk);
            subscription.setActivationRequest(saved);

            subscriptionService.deactivateAll();
            subscriptionService.save(subscription);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/active")
    public ResponseEntity<SubsDTO> getActiveSubscription() {
        Subscription subscription = subscriptionService.getActiveSubs();
        if (subscription == null) {
            return ResponseEntity.noContent().build();
        }
        String licenseKeyRaw = subscription.getLicenseKey();
        LicenseKey licenseKey = LicenseKeyUtility.decrypt(licenseKeyRaw);

        SubsDTO subsDTO = subscriptionService.toDto(licenseKey, subscription);
        return ResponseEntity.ok().body(subsDTO);
    }

    @GetMapping("/activation/request")
    public ResponseEntity<ActivationRequestResponse> getActivationRequest() {
        ActivationRequest ar = activationRequestService.getActiveAR();
        if (ar == null) {
            return ResponseEntity.noContent().build();
        }
        ActivationRequestResponse dto = activationRequesResMapper.toDTO(ar);
        return ResponseEntity.ok().body(dto);
    }

    private String extractLicenseKey(String body) {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode node;
        try {
            node = objectMapper.readTree(body);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Can't read License Key");
        }
        String licenseKeyRaw = node.get("activationResponse").asText(null);
        if (licenseKeyRaw == null) {
            throw new RuntimeException("License key is null");
        }
        return licenseKeyRaw;
    }
}
