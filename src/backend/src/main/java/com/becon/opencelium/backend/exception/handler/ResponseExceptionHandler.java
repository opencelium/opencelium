package com.becon.opencelium.backend.exception.handler;

import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@EnableWebMvc
@ControllerAdvice
public class ResponseExceptionHandler extends ResponseEntityExceptionHandler {

    @Value("${opencelium.debug-mode}")
    private boolean debugMode;

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<Object> accessDeniedHandler(AccessDeniedException ex, WebRequest req) {
        String uri = ((ServletWebRequest) req).getRequest().getRequestURI();
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResource(ex, HttpStatus.FORBIDDEN, uri));
    }

    @ExceptionHandler({ApplicationConfigReadException.class, ApplicationConfigWriteException.class})
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Object> applicationConfigFailureHandler(RuntimeException ex, WebRequest req) {
        if (debugMode) {
            ex.printStackTrace();
        }
        String uri = ((ServletWebRequest) req).getRequest().getRequestURI();
        return ResponseEntity.internalServerError()
                .body(new ErrorResource(ex, HttpStatus.INTERNAL_SERVER_ERROR, uri));
    }

    @ExceptionHandler(value = { Exception.class })
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Object> allExceptionHandler(Exception ex, WebRequest req) {
        if (debugMode) {
            ex.printStackTrace();
        }
        String uri = ((ServletWebRequest)req).getRequest().getRequestURI();
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.INTERNAL_SERVER_ERROR, uri);
        return ResponseEntity.internalServerError().body(errorResource);
    }
}
