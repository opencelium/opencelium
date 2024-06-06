package com.becon.opencelium.backend.exception.handler;

import com.becon.opencelium.backend.resource.error.ErrorResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ResponseEntity<?> handleNoHandlerFoundException(NoHandlerFoundException ex) {
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.BAD_GATEWAY);
        return ResponseEntity.badRequest().body(errorResource);
    }
}
