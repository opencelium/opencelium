package com.becon.opencelium.backend.api.module;

import org.springframework.http.ResponseEntity;

/**
 * Interface for modules that handle reporting operations to a remote service.
 *
 * <p>Implementations of this interface are responsible for transmitting usage history or other
 * reports from the application to an external service portal, ensuring data integrity and
 * appropriate handling of network communication.
 */
public interface ReportModule {

    /**
     * Send operation usage history to service portal
     * @param payload a {@code String} containing the report data to be sent; must not be {@code null}
     *                or empty. The content is expected to be formatted according to the server's
     *                specifications (e.g., JSON, XML).
     * @param payload
     */
    void sendReport(Object payload);

    /**
     * Retrieves the usage history of the last performed operation.
     *
     * <p>This method sends an HTTP GET request to fetch data related to the
     * most recent operation's usage. The returned response may include details
     * such as operation type, execution time, resource consumption, and other
     * relevant metrics.</p>
     *
     * @return a {@link ResponseEntity} containing the usage history data of the last operation
     */
    ResponseEntity<String> getLastOperationUsageHistory();
}
