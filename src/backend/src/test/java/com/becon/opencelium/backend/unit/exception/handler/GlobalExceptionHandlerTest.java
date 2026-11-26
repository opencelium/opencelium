/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.exception.handler;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.handler.GlobalExceptionHandler;
import com.becon.opencelium.backend.exception.handler.ResponseExceptionHandler;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.ExceptionHandlerExceptionResolver;
import org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod;

/**
 * Checks which {@code @ControllerAdvice} Spring MVC picks for an exception when both
 * {@link GlobalExceptionHandler} and {@link ResponseExceptionHandler} are present.
 *
 * <p>Spring takes the first advice that has any handler for the exception, and
 * {@link ResponseExceptionHandler} handles {@link Exception}. The advices are registered here
 * with {@link ResponseExceptionHandler} first, the order a jar may find them in, so only the
 * {@code @Order} of {@link GlobalExceptionHandler} puts it in front.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalExceptionHandlerTest"
 */
class GlobalExceptionHandlerTest {

    private StaticApplicationContext context;

    private AdviceLookup resolver;

    @BeforeEach
    void setUp() {
        context = new StaticApplicationContext();
        context.registerSingleton("responseExceptionHandler", ResponseExceptionHandler.class);
        context.registerSingleton("globalExceptionHandler", GlobalExceptionHandler.class);
        context.refresh();

        resolver = new AdviceLookup();
        resolver.setApplicationContext(context);
        resolver.afterPropertiesSet();
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    @DisplayName("a BUSY refusal is answered by GlobalExceptionHandler even when it is registered last")
    void handlesConflictWhenResponseExceptionHandlerIsRegisteredFirst() {
        GlobalVariableConflictException busy = new GlobalVariableConflictException(
                GlobalVariableConflictException.Code.BUSY, "Global variable 'lastSync' is busy", 3);

        ServletInvocableHandlerMethod handler = resolver.handlerFor(busy);

        assertThat(handler.getBeanType()).isEqualTo(GlobalExceptionHandler.class);
        assertThat(handler.getMethod().getName()).isEqualTo("handleGlobalVariableConflictException");
    }

    @Test
    @DisplayName("a GeneralServiceException is answered with its own status and error code, not the 500")
    void handleGeneralExceptionAnswersWithStatusAndErrorOfExceptionWhenThrown() {
        GeneralServiceException notFound = new GeneralServiceException(
                HttpStatus.NOT_FOUND, ExceptionConstant.USER_NOT_EXIST, "User not found.");

        ServletInvocableHandlerMethod handler = resolver.handlerFor(notFound);
        ResponseEntity<ErrorResource> response = new GlobalExceptionHandler().handleGeneralException(notFound);

        assertThat(handler.getMethod().getName()).isEqualTo("handleGeneralException");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getError()).isEqualTo(ExceptionConstant.USER_NOT_EXIST);
    }

    @Test
    @DisplayName("an exception GlobalExceptionHandler has no handler for still falls through to the 500 of ResponseExceptionHandler")
    void leavesOtherExceptionsToResponseExceptionHandlerWhenNoHandlerMatches() {
        ServletInvocableHandlerMethod handler = resolver.handlerFor(new RuntimeException("SCHEDULER_NOT_FOUND"));

        assertThat(handler.getBeanType()).isEqualTo(ResponseExceptionHandler.class);
        assertThat(handler.getMethod().getName()).isEqualTo("allExceptionHandler");
    }

    /** Exposes the advice lookup that Spring MVC runs for an exception thrown by a controller. */
    private static final class AdviceLookup extends ExceptionHandlerExceptionResolver {

        ServletInvocableHandlerMethod handlerFor(Exception exception) {
            return getExceptionHandlerMethod(null, exception);
        }
    }
}
