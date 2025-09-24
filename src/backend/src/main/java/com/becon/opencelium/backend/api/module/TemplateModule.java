package com.becon.opencelium.backend.api.module;

import org.springframework.http.ResponseEntity;

public interface TemplateModule {

    /**
     * Retrieves all template files as a zip file from a remote API.
     *
     * @return  zip of template files
     */
    ResponseEntity<byte[]> getAllTemplateFiles();
}
