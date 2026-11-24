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
 * settings) is read from the connectors themselves. A global variable the method references is
 * read with its current value when the authenticated user may use it in the workflow of the
 * method. Everything else a method can reference (other methods, the webhook, scripts) is not
 * produced in a test and takes a static value from the user.
 *
 * <p>The workflow of the method is named the way the reference picker names it: {@code
 * connectionId} for a saved workflow, {@code categoryId} for a workflow that is not saved yet, and
 * neither when the method belongs to no workflow, which then reads only variables open to all
 * workflows.
 */
public interface MethodTestService {

    /**
     * Lists the references of {@code method}: those read from a connector, the global variables
     * the test reads by itself, and those that need a static value. Sends no request.
     *
     * @param connectionId the saved workflow of the method, or {@code null}
     * @param categoryId the category of the method's workflow that is not saved yet, or {@code
     *     null}
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 when
     *     the method has no request or both {@code connectionId} and {@code categoryId} are given
     */
    MethodTestReferencesDTO findReferences(MethodDTO method, Long connectionId, Integer categoryId);

    /**
     * Sends the request of the method to the real API and returns what was sent and received.
     *
     * <p>Reading connector data can itself send requests, e.g. to obtain a token. Nothing is saved
     * and nothing is logged to the execution log.
     *
     * @param connectionId the saved workflow of the method, or {@code null}
     * @param categoryId the category of the method's workflow that is not saved yet, or {@code
     *     null}
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 when
     *     the method has no request, when both {@code connectionId} and {@code categoryId} are
     *     given, when a write is not confirmed, when a reference has no static value and the test
     *     cannot resolve it, or when the request cannot be built from the given values
     */
    MethodTestResultDTO test(MethodTestRequestDTO request, Long connectionId, Integer categoryId);

    /**
     * Builds the request of the method, exactly as {@link #test} would send it, and returns it as
     * a cURL command instead of sending it.
     *
     * <p>Connector values are not masked: the command holds the real credentials and tokens, so it
     * can be run as is. Reading connector data can send requests, e.g. to obtain a token; the
     * method's own request is never sent. Nothing is saved and nothing is logged.
     *
     * @param connectionId the saved workflow of the method, or {@code null}
     * @param categoryId the category of the method's workflow that is not saved yet, or {@code
     *     null}
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 when
     *     the method has no request, when both {@code connectionId} and {@code categoryId} are
     *     given, when a reference has no static value and the test cannot resolve it, or when the
     *     request cannot be built from the given values
     */
    MethodCurlResultDTO toCurl(MethodCurlRequestDTO request, Long connectionId, Integer categoryId);
}
