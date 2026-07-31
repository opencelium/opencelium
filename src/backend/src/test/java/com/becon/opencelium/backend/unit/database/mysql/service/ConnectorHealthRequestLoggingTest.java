/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mysql.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthServiceImp;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorStatusListener;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.RequestInv;
import com.becon.opencelium.backend.invoker.entity.ResponseInv;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the configurable request/response logging of
 * {@link ConnectorHealthServiceImp} ({@code opencelium.connector-health.request-logging}).
 *
 * A Logback {@link ListAppender} is attached to the service's logger to capture what
 * would be written. Pinned contract: with logging enabled, every check emits exactly
 * one INFO line carrying the test function's method and unresolved endpoint template,
 * the outcome, the HTTP status, and the response body (or error) truncated to the
 * configured maximum; with logging disabled, checks emit no INFO lines at all.
 *
 * Run with: ./gradlew test --tests "*.ConnectorHealthRequestLoggingTest"
 */
@ExtendWith(MockitoExtension.class)
class ConnectorHealthRequestLoggingTest {

    @Mock
    private ConnectorService connectorService;

    @Mock
    private InvokerService invokerService;

    @Mock
    private ObjectProvider<ConnectorStatusListener> statusListenerProvider;

    private ListAppender<ILoggingEvent> appender;

    private Connector connector;

    @BeforeEach
    void setUp() {
        lenient().when(statusListenerProvider.getIfAvailable(any())).thenReturn((c, s, r) -> { });
        appender = new ListAppender<>();
        appender.start();
        serviceLogger().addAppender(appender);
        connector = new Connector();
        connector.setId(7);
        connector.setTitle("jira");
        connector.setInvoker("Jira");
    }

    @AfterEach
    void tearDown() {
        serviceLogger().detachAppender(appender);
    }

    @Test
    void checkLogsRequestAndResponseWhenLoggingEnabled() throws Exception {
        ConnectorHealthServiceImp service = newService(true, 500);
        doReturn(ResponseEntity.ok("{\"user\":\"admin\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunction());

        service.check(connector);

        List<String> infoLines = infoMessages();
        assertThat(infoLines).hasSize(1);
        assertThat(infoLines.get(0))
                .contains("connector='jira' (id=7)")
                .contains("request=GET {url}/rest/api/2/myself")
                .contains("outcome=UP")
                .contains("http=200")
                .contains("response={\"user\":\"admin\"}");
    }

    @Test
    void checkLogsErrorWhenRequestFailsAndLoggingEnabled() throws Exception {
        ConnectorHealthServiceImp service = newService(true, 500);
        when(connectorService.checkCommunication(connector))
                .thenThrow(new RuntimeException("Connection refused"));
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunction());

        service.check(connector);

        List<String> infoLines = infoMessages();
        assertThat(infoLines).hasSize(1);
        assertThat(infoLines.get(0))
                .contains("outcome=DOWN")
                .contains("http=-")
                .contains("response=Connection refused");
    }

    @Test
    void checkTruncatesResponseBodyWhenLongerThanConfiguredMax() throws Exception {
        ConnectorHealthServiceImp service = newService(true, 10);
        doReturn(ResponseEntity.ok("{\"key\":\"0123456789ABCDEF\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunction());

        service.check(connector);

        assertThat(infoMessages().get(0))
                .contains("response={\"key\":\"01... (truncated)")
                .doesNotContain("ABCDEF");
    }

    @Test
    void checkLogsNothingWhenLoggingDisabled() throws Exception {
        ConnectorHealthServiceImp service = newService(false, 500);
        doReturn(ResponseEntity.ok("{\"user\":\"admin\"}"))
                .when(connectorService).checkCommunication(connector);
        when(invokerService.getTestFunction("Jira")).thenReturn(aTestFunction());

        service.check(connector);

        assertThat(infoMessages()).isEmpty();
    }

    // ── fixtures ──────────────────────────────────────────────────────────────

    private ConnectorHealthServiceImp newService(boolean loggingEnabled, int maxBodyLength) {
        return new ConnectorHealthServiceImp(
                connectorService, invokerService, statusListenerProvider, 3, loggingEnabled, maxBodyLength);
    }

    private static Logger serviceLogger() {
        return (Logger) LoggerFactory.getLogger(ConnectorHealthServiceImp.class);
    }

    private List<String> infoMessages() {
        return appender.list.stream()
                .filter(event -> event.getLevel() == Level.INFO)
                .map(ILoggingEvent::getFormattedMessage)
                .toList();
    }

    /** Test function with a GET method, an unresolved endpoint template, and no fail body. */
    private static FunctionInvoker aTestFunction() {
        RequestInv request = new RequestInv();
        request.setMethod("GET");
        request.setEndpoint("{url}/rest/api/2/myself");

        FunctionInvoker functionInvoker = new FunctionInvoker();
        functionInvoker.setRequest(request);
        functionInvoker.setResponse(new ResponseInv());
        return functionInvoker;
    }
}
