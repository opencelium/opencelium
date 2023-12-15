package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
import com.becon.opencelium.backend.resource.execution.ParamStyle;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.ParameterDTOUtil;
import com.becon.opencelium.backend.resource.execution.RequestBodyDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.constant.RegExpression.hasEnh;

public class RequestEntityBuilder {
    private final OperationDTO operation;
    private final Function<String, SchemaDTO> references;

    private URIBuilder URIBuilder;
    private HeadersBuilder headersBuilder;
    private BodyBuilder requestEntityBuilder;

    public RequestEntityBuilder(OperationDTO operation, Function<String, SchemaDTO> references) {
        this.operation = operation;
        this.references = references;
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
        URI url = Objects.nonNull(URIBuilder) ? URIBuilder.build(operation, references) : defaultURLBuilder();
        HttpMethod method = defaultMethod();
        HttpHeaders headers = Objects.nonNull(headersBuilder) ? headersBuilder.build(operation, references) : defaultHeadersBuilder();
        String body = Objects.nonNull(requestEntityBuilder) ? requestEntityBuilder.build(operation, references) : defaultRequestEntityBuilder();

        return new RequestEntity<>(body, headers, method, url);
    }

    private HttpMethod defaultMethod() {
        return operation.getHttpMethod();
    }

    private URI defaultURLBuilder() {
        // if no parameter just return the 'path'
        if (CollectionUtils.isEmpty(operation.getParameters())) {
            return URI.create(operation.getPath());
        }

        String rawUrl = operation.getPath();

        // replace path parameters
        Map<String, String> paths = getParamsByLocation(ParamLocation.PATH).stream()
                .map(parameter -> Map.entry(parameter.getName(), ParameterDTOUtil.toString(parameter)))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        if (!CollectionUtils.isEmpty(paths)) {
            for (Map.Entry<String, String> entry : paths.entrySet()) {
                String pathName = "{" + entry.getKey() + "}";
                rawUrl = rawUrl.replace(pathName, entry.getValue());
            }
        }

        // replace query parameters
        String queries = getParamsByLocation(ParamLocation.QUERY).stream()
                .map(parameter -> {
                    ParamStyle style = parameter.getStyle();

                    if (style == ParamStyle.DEEP_OBJECT || style == ParamStyle.FORM) {
                        return ParameterDTOUtil.toString(parameter);
                    }

                    return parameter.getName() + "=" + ParameterDTOUtil.toString(parameter);
                })
                .collect(Collectors.joining("&"));

        // remove old query params if exists
        if (rawUrl.indexOf('?') > 0) {
            rawUrl = rawUrl.substring(0, rawUrl.indexOf('?'));
        }

        // add new query params if exists
        if (!ObjectUtils.isEmpty(queries)) {
            rawUrl = rawUrl + "?" + queries;
        }

        return URI.create(rawUrl);
    }

    private HttpHeaders defaultHeadersBuilder() {
        HttpHeaders headers = new HttpHeaders();

        if (CollectionUtils.isEmpty(operation.getParameters())) {
            return headers;
        }

        getParamsByLocation(ParamLocation.HEADER)
                .forEach(p -> headers.put(p.getName(), List.of(ParameterDTOUtil.toString(p))));

        return headers;
    }

    private String defaultRequestEntityBuilder() {
        RequestBodyDTO body = operation.getRequestBody();

        if (ObjectUtils.isEmpty(body)) {
            return "";
        }

        MediaType mediaType = body.getContent();
        if (mediaType == MediaType.APPLICATION_JSON) {
            return SchemaDTOUtil.toJSON(body.getSchema());
        }

        if (mediaType == MediaType.APPLICATION_XML) {
            return SchemaDTOUtil.toXML(body.getSchema());
        }

        // for other types just return schemas' value as text
        return SchemaDTOUtil.toText(body.getSchema());
    }

    private void replaceRefs(SchemaDTO schema) {
        // TODO we do not know type of reference
        String value = schema.getValue();
        SchemaDTO referencedSchema = null;

        boolean isReferenced = ReferenceExtractor.isReference(value);
        if (isReferenced) {
            // if referenced get the actual schema
            referencedSchema = references.apply(value);
        }

        // for primitives just replace reference to actual value then stop recursion
        if (schema.getType() != DataType.OBJECT && schema.getType() != DataType.ARRAY) {
            value = isReferenced ? referencedSchema.getValue() : value;

            schema.setValue(value);
            return;
        }

        if (schema.getType() == DataType.ARRAY) {
            // get real items if referenced and set schemas' fields accordingly
            List<SchemaDTO> items = isReferenced ? referencedSchema.getItems() : schema.getItems();

            schema.setValue(null);
            schema.setItems(items);

            // if items is empty or null then stop recursion
            if (CollectionUtils.isEmpty(items)) return;

            // loop through all items to replace referenced ones
            items.forEach(this::replaceRefs);
            return;
        }

        // At this point we only need to deal with DataType.OBJECT:
        // get real properties if referenced and set schemas' fields accordingly
        Map<String, SchemaDTO> properties = isReferenced ? referencedSchema.getProperties() : schema.getProperties();

        schema.setValue(null);
        schema.setProperties(properties);

        // if properties is empty or null then stop recursion
        if (CollectionUtils.isEmpty(properties)) return;

        // loop through all properties to replace referenced ones
        properties.forEach((name, schemaDTO) -> replaceRefs(schemaDTO));
    }

    private List<ParameterDTO> getParamsByLocation(ParamLocation location) {
        // filters parameter by location and do replacement for references if necessary
        return operation.getParameters().stream()
                .filter(p -> ParamLocation.HEADER == location)
                .peek(parameter -> replaceRefs(parameter.getSchema()))
                .collect(Collectors.toList());
    }
}
