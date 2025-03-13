package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.*;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import com.becon.opencelium.backend.resource.subs.SubsDTO;
import com.becon.opencelium.backend.subscription.dto.ActivationRequestDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.crypto.Base64Utility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping(value = "/api/subs")
@Tag(name = "Subscription")
public class SubscriptionController {

    private final RemoteApi remoteApi;
    private final SubscriptionService subscriptionService;
    private final ActivationRequestService activationRequestService;
    private final ActivationRequestMapper activationRequestMapper;
    private final OperationUsageHistoryService operationUsageHistoryService;
    private final ExtraOpsService extraOpsService;

    public SubscriptionController(
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            @Qualifier("activationRequestServiceImp") ActivationRequestService activationRequestService,
            @Qualifier("operationUsageHistoryServiceImpl") OperationUsageHistoryService operationUsageHistoryService,
            @Qualifier("extraOpsServiceImp") ExtraOpsService extraOpsService,
            ActivationRequestMapper activationRequestMapper

    ) {
        this.subscriptionService = subscriptionService;
        this.activationRequestService = activationRequestService;
        this.remoteApi = RemoteApiFactory.createInstance(ApiType.SERVICE_PORTAL);
        this.activationRequestMapper = activationRequestMapper;
        this.operationUsageHistoryService = operationUsageHistoryService;
        this.extraOpsService = extraOpsService;
    }

    // -------------------- ONLINE -------------------- //

    @GetMapping(path = "/all")
    public ResponseEntity<String> getAllSubscriptions() {
        SubscriptionModule subsModule = (SubscriptionModule) remoteApi.getModule(ApiModule.SUBSCRIPTION);
        return ResponseEntity.ok(subsModule.getAllSubs().getBody());
    }

    @GetMapping(path = "/connection/check")
    public ResponseEntity<?> checkConnection() {
        return ResponseEntity.ok(remoteApi.checkConnection().getBody());
    }

    @GetMapping(path = "/{subId}")
    public ResponseEntity<String> getSubById(@PathVariable String subId) {
        SubscriptionModule module = (SubscriptionModule) remoteApi.getModule(ApiModule.SUBSCRIPTION);
        return ResponseEntity.ok(module.getAllSubs().getBody());
    }

    @PostMapping(path = "/{subId}")
    public ResponseEntity<?> setSubscription(@PathVariable String subId) {
        // generate activationReq object
        ActivationRequest ar = activationRequestService.generateActivReq();
        String encodedAr = Base64Utility.encode(ar);

        // request Service Portal for a license
        SubscriptionModule sModule = (SubscriptionModule) remoteApi.getModule(ApiModule.SUBSCRIPTION);
        File arFile = activationRequestService.createFile(encodedAr, "activation-request");
        String response  = sModule.generateLicenseKey(arFile, subId).getBody();
        String licenseKey = extractLicenseKey(response);
        Subscription subscription = subscriptionService.setSubscription(licenseKey, ar);

        SubsDTO subsDTO = subscriptionService.toDto(LicenseKeyUtility.decrypt(licenseKey), subscription);
        return ResponseEntity.ok().body(subsDTO);
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

        activationRequestService.save(ar);
        activationRequestService.activateTTL(ar);
        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(resource.contentLength())
                .body(resource);
    }

    @GetMapping("/free/activate")
    public ResponseEntity<Resource> activateFreeSub() {
        subscriptionService.createFreeLicenseFileIfNotExists();
        ActivationRequest ar = activationRequestService.readFreeAR()
                .orElseThrow(() -> new RuntimeException("Free Activation Request is not found or not valid"));
        String initLicense = LicenseKeyUtility.readFreeLicense();
        Subscription subscription = subscriptionService.convertToSub(initLicense,ar);
        if(!subscriptionService.exists(subscription.getSubId())) {
            activationRequestService.deactivateAll();
            ar.setActive(true);
            ar.setStatus(ActivReqStatus.PROCESSED);
            activationRequestService.save(ar);
            subscriptionService.save(subscription);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/activate/license", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> activateLicense(@RequestParam("file") MultipartFile licenseKey) {
        String content;
        try {
            content = new String(licenseKey.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Cannot read license file");
        }

        LicenseKey lk = LicenseKeyUtility.decrypt(content);
        if (lk == null) {
            throw new RuntimeException("License is not valid");
        }

        String hmac = lk.getHmac();
        ActivationRequest ar = activationRequestService.findByHmac(hmac);
        if (!LicenseKeyUtility.verify(lk, ar)) {
            throw new RuntimeException("License file is not valid");
        } else {
            activationRequestService.deactivateAll();
            ar.setStatus(ActivReqStatus.PROCESSED);
            ar.setActive(true);
            activationRequestService.save(ar);
            Subscription subscription = subscriptionService.convertToSub(content, ar);
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

    @GetMapping("/valid/activation-request")
    public ResponseEntity<ActivationRequestDTO> getActivationRequest() {
        ActivationRequest ar = activationRequestService.getActiveAR();
        if (ar == null) {
            return ResponseEntity.noContent().build();
        }
        ActivationRequestDTO dto = activationRequestMapper.toDTO(ar);
        return ResponseEntity.ok().body(dto);
    }

    @GetMapping("/operation/usage")
    public ResponseEntity<PaginatedDto> getOperationUsage(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size,
                                                          @RequestParam(defaultValue = "id,asc") String[] sort,
                                                          @RequestParam(required = false) Long startDate,
                                                          @RequestParam(required = false) Long endDate) {

        Page<OperationUsageHistory> usageHistories;
        if (startDate != null || endDate != null) {
            usageHistories = operationUsageHistoryService.findAllByDetailsStartDateBetween(page, size, startDate, endDate, sort);
        } else {
            usageHistories = operationUsageHistoryService.getAllUsage(page, size, sort);
        }

        PaginatedDto dto = operationUsageHistoryService.toPaginatedDto(usageHistories);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/operation/usage/{usageId}/details")
    public ResponseEntity<PaginatedDto> getOperationUsageDetails(
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size,
                                                                @PathVariable Long usageId,
                                                                @RequestParam(defaultValue = "id,asc") String[] sort,
                                                                @RequestParam(required = false) Long startDate,
                                                                @RequestParam(required = false) Long endDate) {
        // Convert Unix timestamps (assumed in seconds) to LocalDateTime if provided, else keep as null.
        LocalDateTime start = startDate != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(startDate), ZoneId.of("UTC"))
                : null;
        LocalDateTime end = endDate != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(endDate), ZoneId.of("UTC"))
                : null;
        Page<OperationUsageHistoryDetail> usageDetails = operationUsageHistoryService
                .getAllUsageDetailsByUsageId(usageId,page, size, sort, start, end);
        PaginatedDto dto = operationUsageHistoryService.toUsageDetailsDto(usageDetails);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping(path = "/{subId}")
    public ResponseEntity<String> deleteBySubId(@PathVariable String subId) {
        subscriptionService.deleteBySubId(subId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping(path = "/license/{licenseId}")
    public ResponseEntity<String> deleteBylicenseId(@PathVariable String licenseId) {
        subscriptionService.deleteByLicenseId(licenseId);
        return ResponseEntity.noContent().build();
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
