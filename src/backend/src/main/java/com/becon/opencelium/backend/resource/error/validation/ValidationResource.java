package com.becon.opencelium.backend.resource.error.validation;

import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import org.springframework.http.HttpStatus;

import java.util.Date;

public class ValidationResource {

    private Date timestamp;
    private int status;
    private String error;
    private String message;
    private ErrorMessageDataResource data;
    private String path;

    public ValidationResource(Exception e, HttpStatus status, String path, ErrorMessageDataResource data){
        this.message = e.getMessage();
        this.status = status.value();
        this.timestamp = new Date();
        this.data = data;
        this.path = path;
    }

    public ValidationResource(){
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
