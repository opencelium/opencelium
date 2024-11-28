package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import org.springframework.http.ResponseEntity;

public interface RemoteApi {
    /**
     * Checks connection to a remote API over HTTP.
     *
     * @return true if the connection is successful, false otherwise
     */
    ResponseEntity<String> checkConnection();

    /**
     * Retrieves an implementation of a specified interface type.
     *
     * @param module the API module
     * @return an implementation of the specified interface type
     * @throws IllegalArgumentException if the interface is not implemented by the class
     */
    <T> T getModule(ApiModule module) throws IllegalArgumentException;
}
