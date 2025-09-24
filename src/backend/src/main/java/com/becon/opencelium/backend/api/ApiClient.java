package com.becon.opencelium.backend.api;

import org.springframework.http.ResponseEntity;

public interface ApiClient<F> {
    /**
     * Checks connection to a remote API over HTTP.
     *
     * @return true if the connection is successful, false otherwise
     */
    ResponseEntity<String> checkConnection();
    ApiType<F> type();
    F features(); // exposes only allowed features
}
