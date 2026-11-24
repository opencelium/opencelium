package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO;

/**
 * Tests a single method of a workflow against the real API.
 *
 * <p>The data of the connectors (credentials, authentication tokens, certificate and timeout
 * settings) is read from the connectors themselves. Everything else a method can reference (other
 * methods, the webhook, scripts) is not produced in a test and takes a static value from the user.
 */
public interface MethodTestService {

    /**
     * Lists the references of {@code method}: those read from a connector, and those that need a
     * static value. Sends no request.
     */
    MethodTestReferencesDTO findReferences(MethodDTO method);

    /**
     * Sends the request of the method to the real API and returns what was sent and received.
     *
     * <p>Reading connector data can itself send requests, e.g. to obtain a token. Nothing is saved
     * and nothing is logged to the execution log.
     *
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 when
     *     the method has no request, when a write is not confirmed, when a reference has no static
     *     value, or when the request cannot be built from the given values
     */
    MethodTestResultDTO test(MethodTestRequestDTO request);

    /**
     * Builds the request of the method, exactly as {@link #test} would send it, and returns it as
     * a cURL command instead of sending it.
     *
     * <p>Connector values are not masked: the command holds the real credentials and tokens, so it
     * can be run as is. Reading connector data can send requests, e.g. to obtain a token; the
     * method's own request is never sent. Nothing is saved and nothing is logged.
     *
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 when
     *     the method has no request, when a reference has no static value, or when the request
     *     cannot be built from the given values
     */
    MethodCurlResultDTO toCurl(MethodCurlRequestDTO request);
}
