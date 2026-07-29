/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService.CheckResult;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthServiceImp;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.ResponseInv;
import com.becon.opencelium.backend.invoker.entity.ResultInv;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ConnectorHealthServiceImp}, one per classification branch.
 *
 * The remote request is stubbed through {@link ConnectorService#checkCommunication}
 * and the test-function fail body through {@link InvokerService#getTestFunction},
 * so no HTTP traffic is involved. Pinned contract: 200 with a clean body → UP
 * (error null), 200 whose body matches the invoker's fail body → AUTH_FAILED
 * carrying the response, 401 → AUTH_FAILED, request exception → DOWN with a null
 * httpStatus. Every result carries a checkedAt timestamp and a non-negative latency.
 *
 * Run with: ./gradlew test --tests "*.ConnectorHealthServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectorHealthServiceImpTest {

    @Mock
    private ConnectorService connectorService;

    @Mock
    private InvokerService invokerService;

    private ConnectorHealthServiceImp service;

    private Connector connector;

    @BeforeEach
    void setUp() {
        service = new ConnectorHealthServiceImp(connectorService, invokerService);
        connector = new Connector();
        connector.setId(7);
        connector.setTitle("jira");
        connector.setInvoker("Jira");
    }

    // ── UP ────────────────────────────────────────────────────────────────────

    @Test
    void checkReturnsUpWhenResponseIsOkAndBodyIsClean() throws Exception {
        doReturn(ResponseEntity.ok("{\"user\":\"admin\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithFailBody());

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.UP);
        assertThat(result.error()).isNull();
        assertThat(result.httpStatus()).isEqualTo(HttpStatus.OK);
        assertThat(result.checkedAt()).isNotNull();
        assertThat(result.latencyMs()).isNotNegative();
    }

    @Test
    void checkReturnsUpWhenInvokerDeclaresNoFailBody() throws Exception {
        doReturn(ResponseEntity.ok("{\"errorMessages\":[\"auth\"]}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithoutFailBody());

        CheckResult result = service.check(connector);

        // Without a declared fail body there is nothing to match against — 200 means UP.
        assertThat(result.status()).isEqualTo(ConnectorStatus.UP);
        assertThat(result.error()).isNull();
    }

    // ── AUTH_FAILED ───────────────────────────────────────────────────────────

    @Test
    void checkReturnsAuthFailedWhenOkResponseMatchesFailBody() throws Exception {
        String responseBody = "{\"errorMessages\":[\"Login denied\"]}";
        doReturn(ResponseEntity.ok(responseBody))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithFailBody());

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.AUTH_FAILED);
        assertThat(result.error()).isEqualTo(responseBody);
        assertThat(result.httpStatus()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void checkReturnsAuthFailedWhenResponseIsUnauthorized() throws Exception {
        doReturn(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"msg\":\"bad token\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithFailBody());

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.AUTH_FAILED);
        assertThat(result.error()).isEqualTo("{\"msg\":\"bad token\"}");
        assertThat(result.httpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void checkReturnsDefaultErrorWhenUnauthorizedResponseHasNoBody() throws Exception {
        doReturn(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build())
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithoutFailBody());

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.AUTH_FAILED);
        assertThat(result.error()).isEqualTo("Error in remote system");
    }

    // ── DOWN ──────────────────────────────────────────────────────────────────

    @Test
    void checkReturnsDownWhenRequestThrows() throws Exception {
        when(connectorService.checkCommunication(connector))
                .thenThrow(new RuntimeException("Connection refused"));

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.DOWN);
        assertThat(result.error()).isEqualTo("Connection refused");
        assertThat(result.httpStatus()).isNull();
        assertThat(result.checkedAt()).isNotNull();
        assertThat(result.latencyMs()).isNotNegative();
    }

    @Test
    void checkReturnsDownWhenRequestTimesOut() throws Exception {
        when(connectorService.checkCommunication(connector))
                .thenThrow(new RuntimeException(new SocketTimeoutException("connect timed out")));

        CheckResult result = service.check(connector);

        assertThat(result.status()).isEqualTo(ConnectorStatus.DOWN);
        assertThat(result.httpStatus()).isNull();
    }

    // ── fixtures ──────────────────────────────────────────────────────────────

    /** Test function whose fail body declares {@code {"errorMessages": [...]}} in json format. */
    private static FunctionInvoker aTestFunctionWithFailBody() {
        Body body = new Body();
        body.setFormat("json");
        body.setFields(Map.of("errorMessages", List.of("auth")));

        ResultInv fail = new ResultInv();
        fail.setBody(body);

        ResponseInv response = new ResponseInv();
        response.setFail(fail);

        FunctionInvoker functionInvoker = new FunctionInvoker();
        functionInvoker.setResponse(response);
        return functionInvoker;
    }

    private static FunctionInvoker aTestFunctionWithoutFailBody() {
        FunctionInvoker functionInvoker = new FunctionInvoker();
        functionInvoker.setResponse(new ResponseInv());
        return functionInvoker;
    }
}
