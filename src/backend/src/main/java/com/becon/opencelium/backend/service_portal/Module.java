package com.becon.opencelium.backend.service_portal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

public interface Module {
    ResponseEntity<String> getAllSubs();
    ResponseEntity<String> getSubById(String id);
    ResponseEntity<String> generateLicense(MultipartFile file);
}
