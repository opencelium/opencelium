package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
import com.becon.opencelium.backend.resource.execution.ParamStyle;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

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
        var body = operation.getRequestBody();

        if(ObjectUtils.isEmpty(body)) {
            return "";
        }

        return RequestEntityBuilderHelper.construct(body.getSchema(), container);
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
                String value = container.getValueByRef(schema.getValue());
                if (schema.getType() == DataType.STRING) {
                    return "\"" + value + "\"";
                }
                return value;
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

            if (CollectionUtils.isEmpty(properties)) {
                return "{}";
            }

            String object = properties.entrySet().stream()
                    .map(entry -> fieldWriter(entry.getKey()) + ": " + construct(entry.getValue(), container))
                    .collect(Collectors.joining(", "));

            return "{" + object + "}";
        }

        private static String constructArray(SchemaDTO schema, ResponseContainer container) {
            List<SchemaDTO> items = schema.getItems();

            if (CollectionUtils.isEmpty(items)) {
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

        private final static String EMPTY_VALUE_ERROR = "PramStyle of %s should not be empty";

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
            validateParamStyleAndLocationsPair(ParamStyle.DEEP_OBJECT, parameter.getIn(), List.of(ParamLocation.QUERY));

            if (!parameter.isExplode()) {
                throw new IllegalStateException("explode must be true for parameter with type " + ParamStyle.DEEP_OBJECT.getStyle());
            }

            SchemaDTO schema = parameter.getSchema();

            validateParamStyleAndDataTypesPair(ParamStyle.DEEP_OBJECT, schema.getType(), List.of(DataType.OBJECT));

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            var properties = isReferenced ? stringToMap(value) : schema.getProperties();

            if (CollectionUtils.isEmpty(properties)) {
                throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.PIPE_DELIMITED.getStyle()));
            }

            // replace referenced fields if exists
            replaceRefs(schema, container);

            return properties.entrySet().stream()
                    .map(entry -> deepObjectToString(parameter.getName() + "[" + entry.getKey() + "]", entry.getValue()))
                    .collect(Collectors.joining("&"));
        }

        private static String constructPipeDelimited(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.PIPE_DELIMITED, parameter.getIn(), List.of(ParamLocation.QUERY));

            if (parameter.isExplode()) {
                throw new IllegalStateException("explode must be false for parameter with type " + ParamStyle.PIPE_DELIMITED.getStyle());
            }

            SchemaDTO schema = parameter.getSchema();

            validateParamStyleAndDataTypesPair(ParamStyle.PIPE_DELIMITED, schema.getType(), List.of(DataType.OBJECT, DataType.ARRAY));

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            // define pipe delimiter (= | )
            final String PIPE = "|";

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.PIPE_DELIMITED.getStyle()));
                }

                return listToString(items, "", PIPE, container);
            }

            // handle case for object
            var properties = isReferenced ? stringToMap(value) : schema.getProperties();

            if (CollectionUtils.isEmpty(properties)) {
                throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.PIPE_DELIMITED.getStyle()));
            }

            return mapToString(properties, "", PIPE, PIPE, container);
        }

        private static String constructSpaceDelimited(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.SPACE_DELIMITED, parameter.getIn(), List.of(ParamLocation.QUERY));

            if (parameter.isExplode()) {
                throw new IllegalStateException("explode must be false for parameter with type " + ParamStyle.SPACE_DELIMITED.getStyle());
            }

            SchemaDTO schema = parameter.getSchema();

            validateParamStyleAndDataTypesPair(ParamStyle.SPACE_DELIMITED, schema.getType(), List.of(DataType.OBJECT, DataType.ARRAY));

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            // define delimiter (= space)
            final String SPACE = "%20";

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.SPACE_DELIMITED.getStyle()));
                }

                return listToString(items, "", SPACE, container);
            }

            // handle case for object
            var properties = isReferenced ? stringToMap(value) : schema.getProperties();

            if (CollectionUtils.isEmpty(properties)) {
                throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.SPACE_DELIMITED.getStyle()));
            }

            return mapToString(properties, "", SPACE, SPACE, container);
        }

        private static String constructSimple(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.SIMPLE, parameter.getIn(), List.of(ParamLocation.PATH, ParamLocation.HEADER));

            SchemaDTO schema = parameter.getSchema();

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            if (schema.getType() == DataType.OBJECT) {
                var properties = isReferenced ? stringToMap(value) : schema.getProperties();

                if (CollectionUtils.isEmpty(properties)) {
                    throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
                }

                String separator = parameter.isExplode() ? "=" : ",";

                return mapToString(properties, "", separator, ",", container);
            }

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
                }

                return listToString(items, "", ",", container);
            }

            if (ObjectUtils.isEmpty(value)) {
                throw new IllegalStateException(String.format(EMPTY_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
            }

            return value;
        }

        private static String constructForm(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.FORM, parameter.getIn(), List.of(ParamLocation.QUERY, ParamLocation.COOKIE));

            SchemaDTO schema = parameter.getSchema();

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            if (schema.getType() == DataType.OBJECT) {
                var properties = isReferenced ? stringToMap(value) : schema.getProperties();

                if (CollectionUtils.isEmpty(properties)) {
                    return parameter.getName() + "=";
                }

                String separator = parameter.isExplode() ? "=" : ",";
                String delimiter = parameter.isExplode() ? "&" : ",";
                String prefix = parameter.isExplode() ? "" : parameter.getName() + "=";

                return mapToString(properties, prefix, separator, delimiter, container);
            }

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    return parameter.getName() + "=";
                }

                String delimiter = parameter.isExplode() ? "&" + parameter.getName() + "=" : ",";
                String prefix = parameter.getName() + "=";

                return listToString(items, prefix, delimiter, container);
            }

            // For primitive types return 'paramName=' + value if it is not empty
            return ObjectUtils.isEmpty(value) ? parameter.getName() + "=" : parameter.getName() + "=" + value;
        }

        private static String constructLabel(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.LABEL, parameter.getIn(), List.of(ParamLocation.PATH));

            SchemaDTO schema = parameter.getSchema();

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            final String prefix = ".";

            if (schema.getType() == DataType.OBJECT) {
                var properties = isReferenced ? stringToMap(value) : schema.getProperties();

                if (CollectionUtils.isEmpty(properties)) {
                    return prefix;
                }

                String separator = parameter.isExplode() ? "=" : ".";

                return mapToString(properties, prefix, separator, ".", container);
            }

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    return prefix;
                }

                return listToString(items, prefix, ".", container);
            }

            // For primitive types return value if it is not empty, otherwise prefix itself
            return ObjectUtils.isEmpty(value) ? prefix : prefix + value;
        }

        private static String constructMatrix(ParameterDTO parameter, ResponseContainer container) {
            validateParamStyleAndLocationsPair(ParamStyle.MATRIX, parameter.getIn(), List.of(ParamLocation.PATH));

            SchemaDTO schema = parameter.getSchema();

            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            if (schema.getType() == DataType.OBJECT) {
                var properties = isReferenced ? stringToMap(value) : schema.getProperties();

                if (CollectionUtils.isEmpty(properties)) {
                    return ";" + parameter.getName();
                }

                String separator = parameter.isExplode() ? "=" : ",";
                String delimiter = parameter.isExplode() ? ";" : ",";
                String prefix = parameter.isExplode() ? ";" : ";" + parameter.getName() + "=";

                return mapToString(properties, prefix, separator, delimiter, container);
            }

            if (schema.getType() == DataType.ARRAY) {
                var items = isReferenced ? stringToList(value) : schema.getItems();

                if (CollectionUtils.isEmpty(items)) {
                    return ";" + parameter.getName();
                }

                String delimiter = parameter.isExplode() ? ";" + parameter.getName() + "=" : ",";
                String prefix = ";" + parameter.getName() + "=";

                return listToString(items, prefix, delimiter, container);
            }

            // For primitive types return ';paramName=' + value if it is not empty
            return ObjectUtils.isEmpty(value) ?
                    ";" + parameter.getName() :
                    ";" + parameter.getName() + "=" + value;
        }

        private static String listToString(List<SchemaDTO> items, String prefix, String delimiter, ResponseContainer container) {
            return prefix + items.stream()
                    .map(item -> {
                        String value = item.getValue();
                        if (referenced(value)) {
                            value = container.getValueByRef(value);
                        }
                        return value;
                    })
                    .collect(Collectors.joining(delimiter));
        }

        private static String mapToString(Map<String, SchemaDTO> properties, String prefix, String separator, String delimiter, ResponseContainer container) {
            return prefix + properties.entrySet().stream()
                    .map(entry -> {
                        String value = entry.getValue().getValue();
                        if (referenced(value)) {
                            value = container.getValueByRef(value);
                        }
                        return entry.getKey() + separator + value;
                    })
                    .collect(Collectors.joining(delimiter));
        }

        private static String deepObjectToString(String pointer, SchemaDTO schema) {
            if (schema.getType() != DataType.OBJECT && schema.getType() != DataType.ARRAY) {
                return pointer + "=" + schema.getValue() ;
            }

            if (schema.getType() == DataType.ARRAY) {
                int index = 0;
                for(SchemaDTO item : schema.getItems()) {
                    deepObjectToString(pointer + "[" + index + "]", item);
                    index++;
                }
            }

            for (Map.Entry<String, SchemaDTO> property : schema.getProperties().entrySet()) {
                return deepObjectToString(pointer + "[" + property.getKey() + "]", property.getValue());
            }
            // TODO what to do if object is empty?
            return null;
        }

        private static List<SchemaDTO> stringToList(String jsonString) {
            return null;
        }

        private static Map<String, SchemaDTO> stringToMap(String jsonString) {
            return null;
        }

        private static void replaceRefs(SchemaDTO schema, ResponseContainer container) {
            String value = schema.getValue();
            boolean isReferenced = referenced(value);
            if (isReferenced) {
                value = container.getValueByRef(value);
            }

            if (schema.getType() != DataType.OBJECT && schema.getType() != DataType.ARRAY) {
                // if schema has a primitive type then just replace value and return
                schema.setValue(value);
                return;
            }

            if (schema.getType() == DataType.ARRAY) {
                // get real items if referenced
                var items = isReferenced ? stringToList(value) : schema.getItems();

                // set schemas' fields accordingly
                schema.setValue(null);
                schema.setItems(items);

                if (CollectionUtils.isEmpty(items)) return;

                items.forEach(item -> replaceRefs(item, container));
                return;
            }

            // get real properties if referenced
            var properties = isReferenced ? stringToMap(value) : schema.getProperties();

            // set schemas' fields accordingly
            schema.setValue(null);
            schema.setProperties(properties);

            if (CollectionUtils.isEmpty(properties)) return;

            properties.forEach((name, schemaDTO) -> replaceRefs(schemaDTO, container));
        }

        private static void validateParamStyleAndLocationsPair(ParamStyle currentStyle, ParamLocation currentLocation, List<ParamLocation> validLocations) {
            if(validLocations.contains(currentLocation)) {
                return;
            }

            String locations = validLocations.stream().map(ParamLocation::getLocation).collect(Collectors.joining(", "));
            throw new IllegalStateException(String.format("ParamStyle of '%s' is used only in [%s]", currentStyle.getStyle(), locations));
        }

        private static void validateParamStyleAndDataTypesPair(ParamStyle currentStyle, DataType currentType, List<DataType> validTypes) {
            if(validTypes.contains(currentType)) {
                return;
            }

            String dataTypes = validTypes.stream().map(DataType::getType).collect(Collectors.joining(", "));
            throw new IllegalStateException(String.format("ParamStyle of '%s' is used only with [%s] types", currentStyle.getStyle(), dataTypes));
        }
    }
}
