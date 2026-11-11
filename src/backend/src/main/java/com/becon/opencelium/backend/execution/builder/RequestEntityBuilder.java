package com.becon.opencelium.backend.execution.builder;

import com.becon.opencelium.backend.enums.execution.DataType;
import com.becon.opencelium.backend.enums.execution.ParamLocation;
import com.becon.opencelium.backend.enums.execution.ParamStyle;
import com.becon.opencelium.backend.reference.ReferenceDetector;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.ParameterDTOUtil;
import com.becon.opencelium.backend.resource.execution.RequestBodyDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import com.becon.opencelium.backend.utility.MediaTypeUtility;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriUtils;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;

public class RequestEntityBuilder {
    private static final String ILLEGAL_URI_CHARACTERS = "\"<>{}|\\^`";

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
        Object body = Objects.nonNull(bodyBuilder) ? bodyBuilder.build(operation, references) : defaultBodyBuilder(headers.getContentType());

        return new RequestEntity<>(body, headers, method, url);
    }

    private HttpMethod defaultMethod() {
        if (operation.getHttpMethod() == null) {
            throw new RuntimeException("Http method should be supplied");
        }

        return operation.getHttpMethod();
    }

    /**
     * Builds the request URI from the endpoint exactly as the user wrote it.
     *
     * <p>Text typed by the user may arrive encoded ({@code %20}) or as is ({@code " "}): it is
     * encoded leniently, so existing escapes are kept and only characters that are not allowed in
     * a URI are encoded. References are replaced by their values, which are encoded as data for
     * the part of the URI they land in, so a value cannot change the structure of the URI.
     */
    private URI defaultURLBuilder() {
        String endpoint = operation.getPath();
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalStateException("Endpoint should be supplied");
        }

        endpoint = endpoint.trim();

        int queryStart = PathAndReferenceUtility.indexOfOutsideReferences(endpoint, '?');
        if (queryStart == -1) {
            return URI.create(buildPath(endpoint));
        }

        String path = buildPath(endpoint.substring(0, queryStart));
        String query = buildQuery(endpoint.substring(queryStart + 1));

        return URI.create(path + "?" + query);
    }

    /**
     * Builds the part of the URI before the query.
     *
     * <p>A reference that starts the endpoint (the base URL, or a whole URL taken from another
     * method) and a connector request data reference such as {@code {url}} hold URL text, so they
     * are inserted as is. Any other reference value is data: everything except the characters
     * allowed in a path is encoded, and {@code '/'} stays a segment separator.
     */
    private String buildPath(String path) {
        StringBuilder result = new StringBuilder();
        int cursor = 0;

        for (int[] span : PathAndReferenceUtility.findReferenceSpans(path)) {
            result.append(encodeLeniently(path.substring(cursor, span[0])));

            String reference = path.substring(span[0], span[1]);
            boolean urlText = span[0] == 0 || ReferenceMatchers.isRequestData(reference);
            result.append(resolvePathReference(reference, urlText));

            cursor = span[1];
        }

        result.append(encodeLeniently(path.substring(cursor)));

        return result.toString();
    }

    private String resolvePathReference(String reference, boolean urlText) {
        ParameterDTO parameter = resolveReferenceParameter(reference, ParamLocation.PATH, ParamStyle.SIMPLE, reference);

        if (urlText) {
            return encodeLeniently(ParameterDTOUtil.toString(parameter));
        }

        encodeValues(parameter.getSchema(), RequestEntityBuilder::encodePathValue);

        return ParameterDTOUtil.toString(parameter);
    }

    /**
     * Builds the query, keeping the order and the text of every pair as the user wrote it.
     *
     * <p>Reference values are encoded as query data, so {@code '&'}, {@code '='}, {@code '+'} and
     * {@code '#'} inside a value cannot split the query. A value that is a single reference keeps
     * the form-style expansion, so an array becomes {@code name=a&name=b}. A pair without
     * {@code '='} that is a single reference holds query text and is inserted as is.
     */
    private String buildQuery(String query) {
        StringJoiner result = new StringJoiner("&");

        for (String pair : PathAndReferenceUtility.splitOutsideReferences(query, '&')) {
            int separator = PathAndReferenceUtility.indexOfOutsideReferences(pair, '=');

            if (separator == -1) {
                result.add(isSingleReference(pair) ? encodeLeniently(resolveAsText(pair)) : encodeQueryText(pair));
                continue;
            }

            String name = encodeQueryText(pair.substring(0, separator));
            String value = pair.substring(separator + 1);

            result.add(isSingleReference(value)
                    ? resolveQueryReference(name, value)
                    : name + "=" + encodeQueryText(value));
        }

        return result.toString();
    }

    private String resolveQueryReference(String encodedName, String reference) {
        ParameterDTO parameter = resolveReferenceParameter(encodedName, ParamLocation.QUERY, ParamStyle.FORM, reference);
        encodeValues(parameter.getSchema(), RequestEntityBuilder::encodeQueryValue);

        return ParameterDTOUtil.toString(parameter);
    }

    /**
     * Encodes query text that may mix typed text with references: typed text leniently, each
     * reference value as query data.
     */
    private String encodeQueryText(String text) {
        StringBuilder result = new StringBuilder();
        int cursor = 0;

        for (int[] span : PathAndReferenceUtility.findReferenceSpans(text)) {
            result.append(encodeLeniently(text.substring(cursor, span[0])));
            result.append(encodeQueryValue(resolveAsText(text.substring(span[0], span[1]))));
            cursor = span[1];
        }

        result.append(encodeLeniently(text.substring(cursor)));

        return result.toString();
    }

    /**
     * Resolves a reference the same way a field mixing text and references is resolved: a missing
     * value becomes an empty string, any other value its {@code toString()}.
     */
    private String resolveAsText(String reference) {
        Object value = references.apply(reference);

        return value == null ? "" : value.toString();
    }

    /**
     * Resolves a reference into a parameter whose schema takes the type of the referenced value,
     * so arrays and objects are serialized in the parameter's style.
     */
    private ParameterDTO resolveReferenceParameter(String name, ParamLocation location, ParamStyle style, String reference) {
        ParameterDTO parameter = new ParameterDTO();
        parameter.setName(name);
        parameter.setIn(location);
        parameter.setStyle(style);
        parameter.setExplode(style == ParamStyle.FORM);
        parameter.setSchema(new SchemaDTO(DataType.STRING, reference));

        replaceRefs(parameter.getSchema());

        return parameter;
    }

    private static boolean isSingleReference(String text) {
        List<int[]> spans = PathAndReferenceUtility.findReferenceSpans(text);

        return spans.size() == 1 && spans.get(0)[0] == 0 && spans.get(0)[1] == text.length();
    }

    private static void encodeValues(SchemaDTO schema, UnaryOperator<String> encoder) {
        if (schema == null) {
            return;
        }

        if (schema.getValue() != null) {
            schema.setValue(encoder.apply(schema.getValue()));
        }

        if (schema.getItems() != null) {
            schema.getItems().forEach(item -> encodeValues(item, encoder));
        }

        if (schema.getProperties() != null) {
            Map<String, SchemaDTO> encoded = new LinkedHashMap<>();
            schema.getProperties().forEach((name, property) -> {
                encodeValues(property, encoder);
                encoded.put(encoder.apply(name), property);
            });
            schema.setProperties(encoded);
        }
    }

    private static String encodePathValue(String value) {
        // keeps '/' as a segment separator, encodes '?', '#', '%', spaces, non-ASCII, ...
        return UriUtils.encodePath(value, StandardCharsets.UTF_8);
    }

    private static String encodeQueryValue(String value) {
        // UriUtils leaves '+', which servers decode as a space, so it is encoded explicitly
        return UriUtils.encodeQueryParam(value, StandardCharsets.UTF_8).replace("+", "%2B");
    }

    private HttpHeaders defaultHeadersBuilder() {
        HttpHeaders headers = new HttpHeaders();

        getParamsByLocation(ParamLocation.HEADER).stream()
                .map(ParameterDTOUtil::copy)
                .peek(parameter -> replaceRefs(parameter.getSchema()))
                .forEach(parameter -> headers.add(parameter.getName(), ParameterDTOUtil.toString(parameter)));

        // collect Cookie parameter(s) in header if exists
        getParamsByLocation(ParamLocation.COOKIE).stream()
                .map(ParameterDTOUtil::copy)
                .peek(parameter -> replaceRefs(parameter.getSchema()))
                .forEach(parameter -> headers.add(HttpHeaders.COOKIE, ParameterDTOUtil.toString(parameter)));

        String cookies = String.join("; ", headers.getOrDefault(HttpHeaders.COOKIE, List.of()));

        if (!cookies.isEmpty()) {
            headers.put(HttpHeaders.COOKIE, List.of(cookies));
        }

        return headers;
    }

    private Object defaultBodyBuilder(MediaType contentType) {
        RequestBodyDTO body = operation.getRequestBody();

        if (body == null) {
            return null;
        }

        if (MediaTypeUtility.isFormUrlencodedCompatible(contentType) && !"CheckMK".equals(operation.getInvoker())) {
            return toFormUrlencoded(body.getSchema());
        }

        // create the copy of current 'schema'
        SchemaDTO copiedSchema = SchemaDTOUtil.copy(body.getSchema());

        // replace all reference value before converting 'body' to String
        replaceRefs(copiedSchema);

        String requestBody;
        MediaType bodyContent = body.getContent();
        if (MediaTypeUtility.isTextPlainCompatible(bodyContent)) {
            requestBody = SchemaDTOUtil.toText(copiedSchema);
        } else if (MediaTypeUtility.isXmlCompatible(bodyContent)) {
            requestBody = SchemaDTOUtil.toXML(copiedSchema);
        } else {
            requestBody = SchemaDTOUtil.toJSON(copiedSchema);
        }

        // TODO: works only for CheckMk. Should be deleted in future releases.
        if ("CheckMK".equals(operation.getInvoker()) && requestBody != null && !requestBody.isEmpty() && MediaTypeUtility.isFormUrlencodedCompatible(contentType)) {
            LinkedMultiValueMap<Object, Object> request = new LinkedMultiValueMap<>();
            request.add("request", requestBody);

            return request;
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

                if (ReferenceDetector.containsReference((String) value)) {
                    value = references.apply((String) value);
                }

                formData.add(property.getKey(), value);
            }

            return formData;
        } else {
            throw new RuntimeException("Unsupported DataType for 'application/x-www-form-urlencoded', type = " + schema.getType());
        }
    }

    /**
     * Encodes URL text that may already be encoded: valid {@code %XX} escapes are kept, and only
     * characters that are not allowed in a URI are encoded. Characters with a meaning in a URI,
     * such as {@code '/'}, {@code '?'}, {@code '&'} or {@code '='}, are left as they are.
     */
    private static String encodeLeniently(String text) {
        if (text == null) {
            return null;
        }

        StringBuilder result = new StringBuilder(text.length());
        int i = 0;
        while (i < text.length()) {
            int codePoint = text.codePointAt(i);
            int length = Character.charCount(codePoint);

            if (codePoint == '%' && isEscapeSequence(text, i)) {
                // keep an existing %XX escape
                result.append(text, i, i + 3);
                length = 3;
            } else if (Character.isWhitespace(codePoint)) {
                // any whitespace (space, tab, newline, ...) becomes a space
                result.append("%20");
            } else if (codePoint == '%' || codePoint < 0x20 || codePoint > 0x7E
                    || ILLEGAL_URI_CHARACTERS.indexOf(codePoint) >= 0) {
                // a lone '%', control characters, non-ASCII and other characters a URI cannot hold
                appendPercentEncoded(result, codePoint);
            } else {
                result.append((char) codePoint);
            }

            i += length;
        }

        return result.toString();
    }

    private static boolean isEscapeSequence(String text, int index) {
        return index + 2 < text.length()
                && HexFormat.isHexDigit(text.charAt(index + 1))
                && HexFormat.isHexDigit(text.charAt(index + 2));
    }

    private static void appendPercentEncoded(StringBuilder result, int codePoint) {
        for (byte b : Character.toString(codePoint).getBytes(StandardCharsets.UTF_8)) {
            result.append('%').append(String.format("%02X", b & 0xFF));
        }
    }

    private void replaceRefs(SchemaDTO schema) {
        if (schema == null) {
            return;
        }

        String value = schema.getValue();

        if (ReferenceDetector.containsReference(value)) {
            SchemaDTO referencedSchema = SchemaDTOUtil.fromObject(references.apply(value));

            if (referencedSchema == null) {
                schema.setValue(null);
            } else if (isReferencedPrimary(schema.getType(), referencedSchema.getType(), value)) {
                // if 'reference' schema is primary then replace all values of this 'schema' with 'referenced' schema
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
                } else if (availableType.isPrimitive()) {
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

    private boolean isReferencedPrimary(DataType actual, DataType referenced, String ref) {
        // if 'actual' type is UNDEFINED or equal to 'resolved' then 'referenced' should be primary
        if (actual == DataType.UNDEFINED || actual == referenced) {
            return true;
        }

        // if 'ref' is a direct reference or enhancement type then 'referenced' should be primary
        if (ReferenceMatchers.isDirect(ref) || ReferenceMatchers.isEnhancement(ref)) {
            return true;
        }

        // if 'ref' is a webhook and variable type is defined explicitly then 'referenced' should be primary
        // validation of DataType is done when parsing this 'ref' in WebhookReference.parse(...)
        return ReferenceMatchers.isWebhook(ref) && ref.contains(":");
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
