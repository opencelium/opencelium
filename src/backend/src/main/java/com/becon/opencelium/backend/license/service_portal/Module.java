package com.becon.opencelium.backend.license.service_portal;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;

public interface Module {
    ResponseEntity<String> getAllSubs();
    ResponseEntity<String> getSubById(String id);
    ResponseEntity<String> generateLicense(String subId, ByteArrayResource file);
}
