package com.becon.opencelium.backend.exception.handler;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.StorageFileNotFoundException;
import com.becon.opencelium.backend.exception.JumpValidationException;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.error.JumpValidationErrorResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.Instant;
import java.util.Date;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ResponseEntity<ErrorResource> handleNoHandlerFoundException(NoHandlerFoundException ex) {
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.BAD_GATEWAY);
        return ResponseEntity.badRequest().body(errorResource);
    }

    @ExceptionHandler(InvalidExpressionException.class)
    public ResponseEntity<ErrorResource> handleInvalidExpressionException(InvalidExpressionException ex) {
        ErrorResource errorResource = new ErrorResource();
        errorResource.setMessage(ex.getMessage());
        errorResource.setError(ex.getErrorCode().getCode());
        errorResource.setTimestamp(Date.from(Instant.now()));
        errorResource.setStatus(HttpStatus.BAD_REQUEST);
        return ResponseEntity.badRequest().body(errorResource);
    }

    @ExceptionHandler(JumpValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<JumpValidationErrorResource> handleJumpValidationException(JumpValidationException ex) {
        return ResponseEntity.badRequest()
                .body(new JumpValidationErrorResource(ex.getViolations()));
    }

    @ExceptionHandler(GeneralServiceException.class)
    public ResponseEntity<ErrorResource> handleGeneralException(GeneralServiceException ex) {
        ErrorResource errorResource = new ErrorResource();
        errorResource.setMessage(ex.getMessage());
        errorResource.setError(ex.getError());
        errorResource.setTimestamp(Date.from(Instant.now()));
        errorResource.setStatus(ex.getStatus());
        return ResponseEntity.status(ex.getStatus())
                .body(errorResource);
    }

    @ExceptionHandler(WrongDecryptException.class)
    public ResponseEntity<ErrorResource> handleWrongDecryptException(WrongDecryptException ex) {
        ErrorResource errorResource = new ErrorResource();
        errorResource.setMessage(ex.getMessage());
        errorResource.setError(ExceptionConstant.DECRYPTION_FAILED);
        errorResource.setTimestamp(Date.from(Instant.now()));
        errorResource.setStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        return ResponseEntity.internalServerError().body(errorResource);
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<?> handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }
}
