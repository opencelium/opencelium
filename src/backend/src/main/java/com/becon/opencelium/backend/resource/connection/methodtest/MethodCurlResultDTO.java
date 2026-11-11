package com.becon.opencelium.backend.resource.connection.methodtest;

import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ConnectorError;
import java.util.List;

/**
 * Result of {@code POST /connection/method/curl}.
 *
 * <p>Either the command was built, and {@code curl} is set, or the data of a connector could not
 * be read, and only {@code connectorErrors} is set.
 *
 * @param curl the request as a cURL command for a POSIX shell, with the connectors' real values
 * @param connectorErrors why the data of a connector could not be read; empty once built
 */
public record MethodCurlResultDTO(String curl, List<ConnectorError> connectorErrors) {

    public MethodCurlResultDTO {
        connectorErrors = connectorErrors == null ? List.of() : List.copyOf(connectorErrors);
    }

    /** Returns the result of a request that was built into {@code curl}. */
    public static MethodCurlResultDTO built(String curl) {
        return new MethodCurlResultDTO(curl, List.of());
    }

    /** Returns the result of a request that was not built because connector data is missing. */
    public static MethodCurlResultDTO notBuilt(List<ConnectorError> connectorErrors) {
        return new MethodCurlResultDTO(null, connectorErrors);
    }
}
