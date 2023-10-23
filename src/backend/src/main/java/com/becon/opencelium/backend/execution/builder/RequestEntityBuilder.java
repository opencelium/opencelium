package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.constant.RegExpression.hasEnh;

public class RequestEntityBuilder {
    private final OperationDTO operation;
    private final ResponseContainer container;

    private URIBuilder URIBuilder;
    private HeadersBuilder headersBuilder;
    private BodyBuilder requestEntityBuilder;

    public RequestEntityBuilder(OperationDTO operation, ResponseContainer container) {
        this.operation = operation;
        this.container = container;
    }

    public static OperationCarrier start() {
        return new OperationCarrier();
    }

    public RequestEntityBuilder withCustomURL(URIBuilder URIBuilder) {
        this.URIBuilder = URIBuilder;
        return this;
    }

    public RequestEntityBuilder withCustomHeaders(HeadersBuilder headersBuilder) {
        this.headersBuilder = headersBuilder;
        return this;
    }

    public RequestEntityBuilder withCustomRequestEntity(BodyBuilder requestEntityBuilder) {
        this.requestEntityBuilder = requestEntityBuilder;
        return this;
    }

    public RequestEntity<?> createRequest() {
        URI url = Objects.nonNull(URIBuilder) ? URIBuilder.build(operation, container) : defaultURLBuilder();
        HttpMethod method = defaultMethod();
        HttpHeaders headers = Objects.nonNull(headersBuilder) ? headersBuilder.build(operation, container) : defaultHeadersBuilder();
        String body = Objects.nonNull(requestEntityBuilder) ? requestEntityBuilder.build(operation, container) : defaultRequestEntityBuilder();

        return new RequestEntity<>(body, headers, method, url);
    }

    private HttpMethod defaultMethod() {
        return operation.getHttpMethod();
    }

    private URI defaultURLBuilder() {
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

    private String defaultRequestEntityBuilder() {
        return RequestEntityBuilderHelper.construct(operation.getRequestBody().getSchema(), container);
    }

    private static class RequestEntityBuilderHelper {
        private static final String DEFAULT_STRING = "";
        private static final Integer DEFAULT_INTEGER = 0;
        private static final Double DEFAULT_DOUBLE = 0.0;
        private static final Boolean DEFAULT_BOOLEAN = false;

        public static String construct(SchemaDTO schema, ResponseContainer container) {
            if (schema == null || schema.getType() == null) {
                throw new IllegalStateException("schema and data type must not be null");
            }

            if (referenced(schema.getValue())) {
                return container.getValueByRef(schema.getValue());
            }

            return switch (schema.getType()) {
                case OBJECT -> constructObject(schema, container);
                case ARRAY -> constructArray(schema, container);
                case STRING -> constructString(schema);
                case NUMBER -> constructNumber(schema);
                case INTEGER -> constructInteger(schema);
                case BOOLEAN -> constructBoolean(schema);
            };
        }

        private static String fieldWriter(String fieldName) {
            return "\"" + fieldName + "\"";
        }

        private static String constructObject(SchemaDTO schema, ResponseContainer container) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            if (properties == null) {
                return "{}";
            }

            String object = properties.entrySet().stream()
                    .map(entry -> fieldWriter(entry.getKey()) + ":" + construct(entry.getValue(), container))
                    .collect(Collectors.joining(", "));

            return "{" + object + "}";
        }

        private static String constructArray(SchemaDTO schema, ResponseContainer container) {
            List<SchemaDTO> items = schema.getItems();

            if (items == null) {
                return "[]";
            }

            String array = items.stream()
                    .map(item -> construct(item, container))
                    .collect(Collectors.joining(", "));

            return "[" + array + "]";
        }

        private static String constructString(SchemaDTO schema) {
            if (schema.getValue() == null) {
                return "\"" + DEFAULT_STRING + "\"";
            }

            return "\"" + schema.getValue() + "\"";
        }

        private static String constructNumber(SchemaDTO schema) {
            if (schema.getValue() == null) {
                return DEFAULT_INTEGER.toString();
            }

            return schema.getValue();
        }

        private static String constructInteger(SchemaDTO schema) {
            if (schema.getValue() == null) {
                return DEFAULT_INTEGER.toString();
            }

            return schema.getValue();
        }

        private static String constructBoolean(SchemaDTO schema) {
            if (schema.getValue() == null) {
                return DEFAULT_BOOLEAN.toString();
            }

            return schema.getValue();
        }

        private static boolean referenced(String value) {
            return Pattern.matches(hasEnh, value);
        }
    }
}
