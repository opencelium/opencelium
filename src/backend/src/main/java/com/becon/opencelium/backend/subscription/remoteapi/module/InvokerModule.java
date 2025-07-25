package com.becon.opencelium.backend.subscription.remoteapi.module;

import org.springframework.http.ResponseEntity;

public interface InvokerModule {

    /**
     * Retrieves all invoker files as zip file from a remote API.
     *
     * @return zip of invoker files
     */
    ResponseEntity<byte[]> getAllInvokerFiles();

    /**
     * Retrieves one invoker file by filename (with file extension) from a remote API.
     *
     * @param invokerName the NAME of the invoker file
     * @return the invoker file
     */
    ResponseEntity<byte[]> getInvokerFileByName(String invokerName);
}
