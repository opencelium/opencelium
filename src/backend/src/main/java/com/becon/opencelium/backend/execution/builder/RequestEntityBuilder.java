package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.util.CollectionUtils;

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

        // map parameters in path to paramName and paramValue pair:
        Map<String, String> paths = parameters.get(ParamLocation.PATH).stream()
                .map(parameter -> Map.entry(parameter.getName(), ParameterBuilderHelper.construct(parameter, container)))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        String rawUrl = operation.getPath();

        for (Map.Entry<String, String> entry : paths.entrySet()) {
            String pathName = "{" + entry.getKey() + "}";
            rawUrl = rawUrl.replace(pathName, entry.getValue());
        }

        // TODO how to append parameters in query?

        return URI.create(rawUrl);
    }

    private HttpHeaders defaultHeadersBuilder() {
        HttpHeaders headers = new HttpHeaders();

        if (CollectionUtils.isEmpty(operation.getParameters())) {
            return headers;
        }

        operation.getParameters().stream()
                .filter(p -> ParamLocation.HEADER == p.getIn())
                .forEach(p -> headers.put(p.getName(), List.of(ParameterBuilderHelper.construct(p, container))));

        return headers;
    }

    private String defaultRequestEntityBuilder() {
        return RequestEntityBuilderHelper.construct(operation.getRequestBody().getSchema(), container);
    }

    private static boolean referenced(String value) {
        return Pattern.matches(hasEnh, value);
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
    }

    private static class ParameterBuilderHelper {

        public static String construct(ParameterDTO parameter, ResponseContainer container) {
            if (parameter == null || parameter.getStyle() == null) {
                throw new IllegalStateException("parameter and parameter style must not be null");
            }

            return switch (parameter.getStyle()) {
                case MATRIX -> constructMatrix(parameter, container);
                case LABEL -> constructLabel(parameter, container);
                case FORM -> constructForm(parameter, container);
                case SIMPLE -> constructSimple(parameter, container);
                case SPACE_DELIMITED -> constructSpaceDelimited(parameter, container);
                case PIPE_DELIMITED -> constructPipeDelimited(parameter, container);
                case DEEP_OBJECT -> constructDeepObject(parameter, container);
            };
        }

        private static String constructDeepObject(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.QUERY != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of DeepObject is used only in query");
            }

            if (!parameter.isExplode()) {
                throw new IllegalStateException("explode must be true for parameter with type DeepObject");
            }

            SchemaDTO schema = parameter.getSchema();
            if (DataType.OBJECT != schema.getType()) {
                throw new IllegalStateException("Parameter type of DeepObject is used only for data type object");
            }

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            final String template = "%s[%s]=%s";

            return schema.getProperties().entrySet().stream()
                    .map(entry -> {
                        String val = entry.getValue().getValue();
                        if (referenced(val)) {
                            val = container.getValueByRef(val);
                        }
                        return Map.entry(entry.getKey(), val);
                    })
                    .map(entry -> String.format(template, parameter.getName(), entry.getKey(), entry.getValue()))
                    .collect(Collectors.joining("&"));
        }

        private static String constructPipeDelimited(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.QUERY != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of PipeDelimited is used only in query");
            }

            if (parameter.isExplode()) {
                throw new IllegalStateException("explode must be false for parameter with type PipeDelimited");
            }

            SchemaDTO schema = parameter.getSchema();
            if (DataType.OBJECT != schema.getType() && DataType.ARRAY != schema.getType()) {
                throw new IllegalStateException("Parameter type of PipeDelimited is used only for data type object and array");
            }

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            // define pipe delimiter
            final String PIPE = "|";

            if (schema.getType() == DataType.ARRAY) {
                // check if array is not empty
                if (CollectionUtils.isEmpty(schema.getItems())) {
                    throw new IllegalStateException("query param should not be empty if paramStyle is pipeDelimited");
                }
                return schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining(PIPE));
            }

            // check if object is not empty
            if (CollectionUtils.isEmpty(schema.getProperties())) {
                throw new IllegalStateException("query param should not be empty if paramStyle is pipeDelimited");
            }

            return schema.getProperties().entrySet().stream()
                    .map(entry -> {
                        String val = entry.getValue().getValue();
                        if (referenced(val)) {
                            val = container.getValueByRef(val);
                        }
                        return entry.getKey() + PIPE + val;
                    })
                    .collect(Collectors.joining(PIPE));
        }

        private static String constructSpaceDelimited(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.QUERY != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of SpaceDelimited is used only in query");
            }

            if (parameter.isExplode()) {
                throw new IllegalStateException("explode must be false for parameter with type SpaceDelimited");
            }

            SchemaDTO schema = parameter.getSchema();
            if (DataType.OBJECT != schema.getType() && DataType.ARRAY != schema.getType()) {
                throw new IllegalStateException("Parameter type of SpaceDelimited is used only for data type object and array");
            }

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            // define space delimiter
            final String SPACE = "%20";

            if (schema.getType() == DataType.ARRAY) {
                // check if array is not empty
                if (CollectionUtils.isEmpty(schema.getItems())) {
                    throw new IllegalStateException("query param should not be empty if paramStyle is spaceDelimited");
                }
                return schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining(SPACE));
            }

            // check if object is not empty
            if (CollectionUtils.isEmpty(schema.getProperties())) {
                throw new IllegalStateException("query param should not be empty if paramStyle is spaceDelimited");
            }

            return schema.getProperties().entrySet().stream()
                    .map(entry -> {
                        String val = entry.getValue().getValue();
                        if (referenced(val)) {
                            val = container.getValueByRef(val);
                        }
                        return entry.getKey() + SPACE + val;
                    })
                    .collect(Collectors.joining(SPACE));
        }

        private static String constructSimple(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.PATH != parameter.getIn() && ParamLocation.HEADER != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of Simple is used in path and header");
            }

            SchemaDTO schema = parameter.getSchema();

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            if (schema.getType() == DataType.OBJECT) {
                String separator = parameter.isExplode() ? "=" : ",";

                return schema.getProperties().entrySet().stream()
                        .map(entry -> {
                            String val = entry.getValue().getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return entry.getKey() + separator + val;
                        })
                        .collect(Collectors.joining(","));
            }

            if (schema.getType() == DataType.ARRAY) {
                return schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining(","));
            }

            String val = schema.getValue();
            if (referenced(val)) {
                return container.getValueByRef(val);
            }

            return val;
        }

        private static String constructForm(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.QUERY != parameter.getIn() && ParamLocation.COOKIE != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of Simple is used in query and cookie");
            }

            SchemaDTO schema = parameter.getSchema();

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            if (schema.getType() == DataType.OBJECT) {
                String separator = parameter.isExplode() ? "=" : ",";
                String delimiter = parameter.isExplode() ? "&" : ",";
                String prefix = parameter.isExplode() ? "" : parameter.getName() + "=";

                return prefix + schema.getProperties().entrySet().stream()
                        .map(entry -> {
                            String val = entry.getValue().getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return entry.getKey() + separator + val;
                        })
                        .collect(Collectors.joining(delimiter));
            }

            if (schema.getType() == DataType.ARRAY) {
                String delimiter = parameter.isExplode() ? "&" + parameter.getName() + "=" : ",";
                String prefix = parameter.getName() + "=";

                return prefix + schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining(delimiter));
            }

            String val = schema.getValue();
            if (referenced(val)) {
                return parameter.getName() + "=" + container.getValueByRef(val);
            }

            return parameter.getName() + "=" + val;
        }

        private static String constructLabel(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.PATH != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of Simple is used only in path");
            }

            SchemaDTO schema = parameter.getSchema();

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            String prefix = ".";

            if (schema.getType() == DataType.OBJECT) {
                String separator = parameter.isExplode() ? "=" : ".";

                return prefix + schema.getProperties().entrySet().stream()
                        .map(entry -> {
                            String val = entry.getValue().getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return entry.getKey() + separator + val;
                        })
                        .collect(Collectors.joining("."));
            }

            if (schema.getType() == DataType.ARRAY) {
                return prefix + schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining("."));
            }

            String val = schema.getValue();
            if (referenced(val)) {
                return prefix + container.getValueByRef(val);
            }

            return prefix + val;
        }

        private static String constructMatrix(ParameterDTO parameter, ResponseContainer container) {
            if (ParamLocation.PATH != parameter.getIn()) {
                throw new IllegalStateException("Parameter type of Simple is used only in path");
            }

            SchemaDTO schema = parameter.getSchema();

            if (referenced(schema.getValue())) {
                //TODO reconstruct referenced object if this is possible?
                return container.getValueByRef(schema.getValue());
            }

            if (schema.getType() == DataType.OBJECT) {
                String separator = parameter.isExplode() ? "=" : ",";
                String delimiter = parameter.isExplode() ? ";" : ",";
                String prefix = parameter.isExplode() ? ";" : ";" + parameter.getName() + "=";

                return prefix + schema.getProperties().entrySet().stream()
                        .map(entry -> {
                            String val = entry.getValue().getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return entry.getKey() + separator + val;
                        })
                        .collect(Collectors.joining(delimiter));
            }

            if (schema.getType() == DataType.ARRAY) {
                String delimiter = parameter.isExplode() ? ";" + parameter.getName() + "=" : ",";
                String prefix = ";" + parameter.getName() + "=";

                return prefix + schema.getItems().stream()
                        .map(item -> {
                            String val = item.getValue();
                            if (referenced(val)) {
                                val = container.getValueByRef(val);
                            }
                            return val;
                        })
                        .collect(Collectors.joining(delimiter));
            }

            String val = schema.getValue();
            if (referenced(val)) {
                return ";" + parameter.getName() + "=" + container.getValueByRef(val);
            }

            return ";" + parameter.getName() + "=" + val;
        }
    }
}
