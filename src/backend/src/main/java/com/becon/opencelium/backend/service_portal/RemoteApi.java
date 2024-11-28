package com.becon.opencelium.backend.service_portal;

import org.springframework.http.ResponseEntity;

public abstract class RemoteApi {
    public abstract ResponseEntity<?> checkConnection();
    public abstract Module getModule();
}