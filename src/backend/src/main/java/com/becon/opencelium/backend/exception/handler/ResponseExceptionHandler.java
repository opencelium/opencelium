package com.becon.opencelium.backend.exception.handler;

import com.becon.opencelium.backend.exception.ApplicationConfigReadException;
import com.becon.opencelium.backend.exception.ApplicationConfigValidationException;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.fasterxml.jackson.databind.JsonMappingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Date;
import java.util.stream.Collectors;

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

    @ExceptionHandler(ApplicationConfigValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Object> applicationConfigValidationHandler(RuntimeException ex, WebRequest req) {
        String uri = ((ServletWebRequest) req).getRequest().getRequestURI();
        return ResponseEntity.badRequest()
                .body(new ErrorResource(ex, HttpStatus.BAD_REQUEST, uri));
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

    /**
     * Turns Jackson deserialization failures into a readable 400 instead of Spring's
     * generic "Failed to read request" — e.g. an invalid {@code methodType} yields
     * {@code Invalid value at 'fromConnector.methods[0].methodType': Unknown method type 'xyz'.
     * Accepted values: CONNECTOR, HTTP_REQUEST, WEBHOOK}.
     */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest req) {
        String uri = ((ServletWebRequest) req).getRequest().getRequestURI();
        ErrorResource errorResource = new ErrorResource();
        errorResource.setStatus(HttpStatus.BAD_REQUEST);
        errorResource.setError(HttpStatus.BAD_REQUEST.name());
        errorResource.setMessage(toReadableMessage(ex));
        errorResource.setTimestamp(new Date());
        errorResource.setPath(uri);
        return ResponseEntity.badRequest().body(errorResource);
    }

    private static String toReadableMessage(HttpMessageNotReadableException ex) {
        if (!(ex.getCause() instanceof JsonMappingException jsonEx)) {
            return "Malformed request body";
        }
        Throwable rootCause = jsonEx;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }
        String fieldPath = jsonEx.getPath().stream()
                .map(ref -> ref.getFieldName() != null ? ref.getFieldName() : "[" + ref.getIndex() + "]")
                .collect(Collectors.joining("."))
                .replace(".[", "[");
        if (fieldPath.isEmpty()) {
            return rootCause.getMessage();
        }
        return "Invalid value at '" + fieldPath + "': " + rootCause.getMessage();
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
