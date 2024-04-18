package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParamLocation;
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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.ObjectUtils;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.constant.RegExpression.directRef;


public class RequestEntityBuilder {
    private final OperationDTO operation;
    private final Function<String, Object> references;

    private URIBuilder URIBuilder;
    private HeadersBuilder headersBuilder;
    private BodyBuilder bodyBuilder;

    public RequestEntityBuilder(OperationDTO operation, Function<String, Object> references) {
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

    public RequestEntityBuilder withCustomBody(BodyBuilder bodyBuilder) {
        this.bodyBuilder = bodyBuilder;
        return this;
    }

    public RequestEntity<Object> createRequest() {
        URI url = Objects.nonNull(URIBuilder) ? URIBuilder.build(operation, references) : defaultURLBuilder();
        HttpMethod method = defaultMethod();
        HttpHeaders headers = Objects.nonNull(headersBuilder) ? headersBuilder.build(operation, references) : defaultHeadersBuilder();
        Object body = Objects.nonNull(bodyBuilder) ? bodyBuilder.build(operation, references) : defaultBodyBuilder();

        return new RequestEntity<>(body, headers, method, url);
    }

    private HttpMethod defaultMethod() {
        if (operation.getHttpMethod() == null) {
            throw new RuntimeException("Http method should be supplied");
        }

        return operation.getHttpMethod();
    }

    private URI defaultURLBuilder() {
        String rawUrl = operation.getPath();

        // replace path parameters
        for (ParameterDTO parameter : getParamsByLocation(ParamLocation.PATH)) {
            // create the copy of current 'parameter'
            ParameterDTO copiedParameter = ParameterDTOUtil.copy(parameter);

            // get 'reference' to replace it later with actual value
            String ref = copiedParameter.getSchema().getValue();

            // replace referenced schema
            replaceRefs(copiedParameter.getSchema());

            // convert parameter to string, and replace this path variable with actual value
            rawUrl = rawUrl.replace(ref, ParameterDTOUtil.toString(copiedParameter));
        }

        // remove old query params if exists
        if (rawUrl.indexOf('?') > 0) {
            rawUrl = rawUrl.substring(0, rawUrl.indexOf('?'));
        }

        // add query parameters if exists
        String query = getParamsByLocation(ParamLocation.QUERY).stream()
                .map(ParameterDTOUtil::copy)
                .peek(parameter -> replaceRefs(parameter.getSchema()))
                .map(ParameterDTOUtil::toString)
                .collect(Collectors.joining("&"));

        if (!ObjectUtils.isEmpty(query)) {
            rawUrl = rawUrl + "?" + query;
        }

        return URI.create(rawUrl);
    }

    private HttpHeaders defaultHeadersBuilder() {
        HttpHeaders headers = new HttpHeaders();

        getParamsByLocation(ParamLocation.HEADER).stream()
                .map(ParameterDTOUtil::copy)
                .peek(parameter -> replaceRefs(parameter.getSchema()))
                .forEach(parameter -> headers.put(parameter.getName(), List.of(ParameterDTOUtil.toString(parameter))));

        return headers;
    }

    private Object defaultBodyBuilder() {
        RequestBodyDTO body = operation.getRequestBody();

        if (body == null) {
            return null;
        }

        MediaType mediaType = body.getContent();
        if (MediaType.APPLICATION_FORM_URLENCODED.isCompatibleWith(mediaType)) {
            return toFormUrlencoded(body.getSchema());
        }

        // create the copy of current 'schema'
        SchemaDTO copiedSchema = SchemaDTOUtil.copy(body.getSchema());

        // replace all reference value before converting 'body' to String
        replaceRefs(copiedSchema);

        String requestBody;
        if (MediaType.TEXT_PLAIN.isCompatibleWith(mediaType)) {
            requestBody = SchemaDTOUtil.toText(copiedSchema);
        } else if (MediaType.APPLICATION_XML.isCompatibleWith(mediaType)) {
            requestBody = SchemaDTOUtil.toXML(copiedSchema);
        }  else {
            requestBody = SchemaDTOUtil.toJSON(copiedSchema);
        }

        return requestBody;
    }

    private MultiValueMap<String, Object> toFormUrlencoded(SchemaDTO schema) {
        if (schema == null) {
            return null;
        }

        if (schema.getType() == DataType.OBJECT) {
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();

            Map<String, SchemaDTO> properties = schema.getProperties();
            if (properties == null) {
                return formData;
            }

            Object value;
            for (Map.Entry<String, SchemaDTO> property : properties.entrySet()) {
                value = property.getValue() == null ? null : property.getValue().getValue();

                if (value != null && ReferenceExtractor.isReference((String) value)) {
                    value = references.apply((String) value);
                }

                formData.add(property.getKey(), value);
            }

            return formData;
        } else {
            throw new RuntimeException("Unsupported DataType for 'application/x-www-form-urlencoded', type = " + schema.getType());
        }
    }

    private void replaceRefs(SchemaDTO schema) {
        if (schema == null) {
            return;
        }

        String value = schema.getValue();

        if (ReferenceExtractor.isReference(value)) {
            SchemaDTO referencedSchema = SchemaDTOUtil.fromObject(references.apply(value));;

            if (referencedSchema == null) {
                schema.setValue(null);
            } else if (schema.getType() == DataType.UNDEFINED || schema.getType() == referencedSchema.getType() || value.matches(directRef)) {
                // if type of schema is UNDEFINED or the same as referencedSchema then
                // replace all values of this schema with referenced schema
                schema.setType(referencedSchema.getType());
                schema.setValue(referencedSchema.getValue());
                schema.setItems(referencedSchema.getItems());
                schema.setProperties(referencedSchema.getProperties());
                schema.setXml(referencedSchema.getXml());
            } else {
                // schema and referencedSchema both not null and have different type
                DataType requiredType = schema.getType();
                DataType availableType = referencedSchema.getType();
                // do some cleanup to the schema
                schema.setValue(null);
                schema.setItems(null);
                schema.setXml(null);
                schema.setProperties(null);

                if (requiredType == DataType.ARRAY) {
                    schema.setItems(List.of(referencedSchema));
                } else if (requiredType == DataType.OBJECT) {
                    schema.setProperties(Map.of(referencedSchema.getValue(), referencedSchema));
                } else if (availableType.isPrimitive()){
                    schema.setValue(referencedSchema.getValue());
                } else {
                    throw new RuntimeException(String.format("SchemaDTO cannot be converted from %s type to %s type", availableType, requiredType));
                }
            }

            // referenced schema does not contain other reference, end recursion
            return;
        }

        List<SchemaDTO> items = schema.getItems();
        if (schema.getType() == DataType.ARRAY && items != null) {
            // loop through all 'items' to replace referenced ones
            items.forEach(this::replaceRefs);
        }

        Map<String, SchemaDTO> properties = schema.getProperties();
        if (schema.getType() == DataType.OBJECT && properties != null) {
            // loop through all 'properties' to replace referenced ones
            properties.forEach((name, schemaDTO) -> replaceRefs(schemaDTO));
        }
    }

    private List<ParameterDTO> getParamsByLocation(ParamLocation location) {
        // if operation does not have parameters, then just return empty list
        if (CollectionUtils.isEmpty(operation.getParameters())) {
            return new ArrayList<>();
        }

        // filters parameter by location
        return operation.getParameters().stream()
                .filter(Objects::nonNull)
                .filter(p -> p.getIn() == location)
                .filter(p -> p.getSchema() != null)
                .collect(Collectors.toList());
    }
}