package com.becon.opencelium.backend.subscription.remoteapi.module;

import org.springframework.http.ResponseEntity;

import java.io.File;
import java.util.List;

public interface SubscriptionModule {

    /**
     * Retrieves all subscriptions from the ServicePortal.
     *
     * @return a list of all subscriptions
     */
    ResponseEntity<String> getAllSubs();

    /**
     * Retrieves a subscription by its ID.
     *
     * @param id the ID of the subscription
     * @return the subscription with the specified ID
     */
    ResponseEntity<String> getSubById(String id);

    /**
     * Generates a license key.
     *
     * @param activeRequest the activation request in File format
     * @param subId the ID of the subscription
     * @return the generated license key as a String
     */
    ResponseEntity<String> generateLicenseKey(File activeRequest, String subId);
}