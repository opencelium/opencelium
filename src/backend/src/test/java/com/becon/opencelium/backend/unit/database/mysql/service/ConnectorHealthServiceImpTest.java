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
import com.becon.opencelium.backend.database.mysql.service.ConnectorStatusListener;
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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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

    private static final int FAILURE_THRESHOLD = 3;

    @Mock
    private ConnectorService connectorService;

    @Mock
    private InvokerService invokerService;

    @Mock
    private ObjectProvider<ConnectorStatusListener> statusListenerProvider;

    @Mock
    private ConnectorStatusListener statusListener;

    private ConnectorHealthServiceImp service;

    private Connector connector;

    @BeforeEach
    void setUp() {
        when(statusListenerProvider.getIfAvailable(any())).thenReturn(statusListener);
        service = new ConnectorHealthServiceImp(
                connectorService, invokerService, statusListenerProvider, FAILURE_THRESHOLD, false, 500);
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

    // ── runCheck — the damped write path ──────────────────────────────────────

    @Test
    void runCheckWritesTimestampButNotStatusWhenStatusIsUnchanged() throws Exception {
        connector.setStatus(ConnectorStatus.UP);
        stubCheckReturningUp();

        service.runCheck(connector);

        verify(connectorService).updateLastCheckedAt(eq(7), any());
        verify(connectorService, never()).updateStatus(anyInt(), any(), any());
        verifyNoInteractions(statusListener);
    }

    @Test
    void runCheckPublishesUpWithClearedErrorWhenConnectorRecovers() throws Exception {
        connector.setStatus(ConnectorStatus.DOWN);
        stubCheckReturningUp();

        service.runCheck(connector);

        // Recovery is published on the first successful check, with the error cleared,
        // and the listener fires strictly after the database write.
        var order = inOrder(connectorService, statusListener);
        order.verify(connectorService).updateStatus(7, ConnectorStatus.UP, null);
        order.verify(statusListener).onStatusTransition(eq(connector), eq(ConnectorStatus.UP), any());
    }

    @Test
    void runCheckPublishesDownOnlyWhenFailuresReachThreshold() throws Exception {
        connector.setStatus(ConnectorStatus.UP);
        when(connectorService.checkCommunication(connector))
                .thenThrow(new RuntimeException("Connection refused"));

        service.runCheck(connector);
        service.runCheck(connector);
        verify(connectorService, never()).updateStatus(anyInt(), any(), any());

        service.runCheck(connector);

        verify(connectorService).updateStatus(7, ConnectorStatus.DOWN, "Connection refused");
        verify(statusListener, times(1)).onStatusTransition(eq(connector), eq(ConnectorStatus.DOWN), any());
        // The timestamp is written on every check, transition or not.
        verify(connectorService, times(3)).updateLastCheckedAt(eq(7), any());
    }

    @Test
    void runCheckDampsAuthFailedLikeDown() throws Exception {
        connector.setStatus(ConnectorStatus.UP);
        doReturn(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build())
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithoutFailBody());

        service.runCheck(connector);
        service.runCheck(connector);
        verify(connectorService, never()).updateStatus(anyInt(), any(), any());

        service.runCheck(connector);

        verify(connectorService).updateStatus(7, ConnectorStatus.AUTH_FAILED, "Error in remote system");
    }

    @Test
    void runCheckTreatsClassificationErrorAsDown() throws Exception {
        ConnectorHealthServiceImp impatientService = new ConnectorHealthServiceImp(
                connectorService, invokerService, statusListenerProvider, 1, false, 500);
        connector.setStatus(ConnectorStatus.UP);
        doReturn(ResponseEntity.ok("{}")).when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenThrow(new RuntimeException("Invoker not found"));

        impatientService.runCheck(connector);

        verify(connectorService).updateLastCheckedAt(eq(7), any());
        verify(connectorService).updateStatus(7, ConnectorStatus.DOWN, "Invoker not found");
    }

    @Test
    void runCheckSkipsWhenCheckForSameConnectorIsInFlight() throws Exception {
        connector.setStatus(ConnectorStatus.UP);
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(connectorService.checkCommunication(connector)).thenAnswer(invocation -> {
            entered.countDown();
            release.await(5, TimeUnit.SECONDS);
            return ResponseEntity.ok("{}");
        });
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithoutFailBody());
        Thread firstCheck = new Thread(() -> service.runCheck(connector));
        firstCheck.start();
        assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();

        // While the first check still holds the in-flight flag, a second call must
        // return immediately without touching the remote API or the database.
        service.runCheck(connector);

        release.countDown();
        firstCheck.join(TimeUnit.SECONDS.toMillis(5));
        verify(connectorService, times(1)).checkCommunication(connector);
        verify(connectorService, times(1)).updateLastCheckedAt(eq(7), any());
    }

    @Test
    void runCheckRestartsFailureCounterWhenStateWasEvicted() throws Exception {
        connector.setStatus(ConnectorStatus.UP);
        when(connectorService.checkCommunication(connector))
                .thenThrow(new RuntimeException("Connection refused"));

        service.runCheck(connector);
        service.runCheck(connector);
        service.evict(7);
        // Without the eviction the third failure would have crossed the threshold.
        service.runCheck(connector);
        service.runCheck(connector);
        verify(connectorService, never()).updateStatus(anyInt(), any(), any());

        service.runCheck(connector);

        verify(connectorService, times(1)).updateStatus(7, ConnectorStatus.DOWN, "Connection refused");
    }

    // ── fixtures ──────────────────────────────────────────────────────────────

    private void stubCheckReturningUp() throws Exception {
        doReturn(ResponseEntity.ok("{\"user\":\"admin\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunctionWithoutFailBody());
    }

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
