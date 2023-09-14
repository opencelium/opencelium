package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.http.HttpRequest;
import org.springframework.http.ResponseEntity;

public class RequestBuilder {
    private OperationDTO operation;
    private ResponseContainer container;

    private RequestBuilder() {
    }

    public static RequestBuilder newInstance() {
        return new RequestBuilder();
    }

    public RequestBuilder forOperation(OperationDTO operation) {
        this.operation = operation;
        return this;
    }

    public RequestBuilder usingContainer(ResponseContainer container) {
        this.container = container;
        return this;
    }

    public HttpRequest createRequest() {
        return null;
    }

    private void setMethod() {
    }
    private void buildUrl() {
    }
    private void buildHeader() {
    }
    private void buildBody() {
    }
}
