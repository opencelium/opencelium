package com.becon.opencelium.backend.exception.handler;

import com.becon.opencelium.backend.resource.error.ErrorResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@EnableWebMvc
@ControllerAdvice
public class ResponseExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = { Exception.class })
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Object> unknownException(Exception ex, WebRequest req) {
        ex.printStackTrace();
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.INTERNAL_SERVER_ERROR, req.getContextPath());
        return ResponseEntity.internalServerError().body(errorResource);
    }
}
