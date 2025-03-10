package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.service.ActivationRequestService;
import com.becon.opencelium.backend.database.mysql.service.ExtraOpsService;
import com.becon.opencelium.backend.database.mysql.service.OperationUsageHistoryService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.subscription.dto.EncryptedExtraOpsFile;
import com.becon.opencelium.backend.subscription.dto.ExtraOpsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping(value = "/api/extra-ops")
@Tag( name = "Extra Operations",
      description = "Extra Operations are temporary allowances that extend a user’s " +
                    "monthly quota, consumed in FIFO order, and expiring at the end " +
                    "of the month without rollover. ")
public class ExtraOpsController {

    private final SubscriptionService subscriptionService;
    private final ExtraOpsService extraOpsService;

    public ExtraOpsController(
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            @Qualifier("extraOpsServiceImp") ExtraOpsService extraOpsService
    ) {
        this.subscriptionService = subscriptionService;
        this.extraOpsService = extraOpsService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadExtraOps(@RequestParam("file") MultipartFile extraOpsFile) {
        String content;
        try {
            content = new String(extraOpsFile.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Cannot read Extra Ops file");
        }

        EncryptedExtraOpsFile encryptedExtraOpsFile = extraOpsService.decrypt(content);
        if (encryptedExtraOpsFile == null) {
            throw new RuntimeException("Extra Ops is not valid");
        }
        Subscription sub = subscriptionService.findByLicenseId(encryptedExtraOpsFile.getLicenseId());
        ExtraOps extraOps = extraOpsService.toEntityFromEncryption(encryptedExtraOpsFile);
        extraOps.setSubscription(sub);
        extraOpsService.save(extraOps);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        extraOpsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/delete/list")
    public ResponseEntity<?> deleteList(@RequestBody List<Long> ids) {
        extraOpsService.deleteList(ids);
        return ResponseEntity.noContent().build();
    }
}
