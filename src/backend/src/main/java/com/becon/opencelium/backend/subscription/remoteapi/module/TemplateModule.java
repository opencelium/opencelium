package com.becon.opencelium.backend.subscription.remoteapi.module;

import org.springframework.http.ResponseEntity;

public interface TemplateModule {

    /**
     * Retrieves all template files as a zip file from a remote API.
     *
     * @return  zip of template files
     */
    ResponseEntity<byte[]> getAllTemplateFiles();
}
