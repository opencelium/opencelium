package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class RequestBuilder {
    private final OperationDTO operation;
    private final ResponseContainer container;

    private URLBuilder urlBuilder;
    private HeadersBuilder headersBuilder;
    private BodyBuilder bodyBuilder;

    public RequestBuilder(OperationDTO operation, ResponseContainer container) {
        this.operation = operation;
        this.container = container;
    }

    public static OperationCarrier start() {
        return new OperationCarrier();
    }

    public RequestBuilder withCustomURL(URLBuilder urlBuilder) {
        this.urlBuilder = urlBuilder;
        return this;
    }

    public RequestBuilder withCustomHeaders(HeadersBuilder headersBuilder) {
        this.headersBuilder = headersBuilder;
        return this;
    }

    public RequestBuilder withCustomBody(BodyBuilder bodyBuilder) {
        this.bodyBuilder = bodyBuilder;
        return this;
    }

    public Request createRequest() {
        var url = Objects.nonNull(urlBuilder) ? urlBuilder.buildURL(operation, container) : defaultURLBuilder();
        var httpMethod = defaultMethod();
        var httpHeaders = Objects.nonNull(headersBuilder) ? headersBuilder.buildHeaders(operation, container) : defaultHeadersBuilder();
        var requestEntity = Objects.nonNull(bodyBuilder) ? bodyBuilder.buildBody(operation, container) : defaultBodyBuilder();

        return new Request(url, httpMethod, httpHeaders, requestEntity);
    }

    private HttpMethod defaultMethod() {
        return operation.getHttpMethod();
    }

    private String defaultURLBuilder() {
        Map<ParamLocation, List<ParameterDTO>> parameters = operation.getParameters().stream()
                .collect(Collectors.groupingBy(ParameterDTO::getIn));

        return null;
    }

    private HttpHeaders defaultHeadersBuilder() {
        HttpHeaders headers = new HttpHeaders();

        operation.getParameters().stream()
                .filter(p -> ParamLocation.HEADER == p.getIn())
                .forEach(p -> {
                    // TODO do replacement for reference values and conversion if needed
                    headers.put(p.getName(), List.of(p.getSchema().getValue()));
                });

        return headers;
    }

    private RequestEntity<?> defaultBodyBuilder() {

        return null;
    }
}
