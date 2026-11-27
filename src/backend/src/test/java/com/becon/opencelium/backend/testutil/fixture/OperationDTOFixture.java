package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.enums.execution.ParamLocation;
import com.becon.opencelium.backend.enums.execution.ParamStyle;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.ParameterDTO;
import com.becon.opencelium.backend.resource.execution.RequestBodyDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.MediaType;

/**
 * Object mother for {@link OperationDTO}, the execution view of a method.
 */
public final class OperationDTOFixture {

    // without an invoker the mapper reads only the method itself, never its services
    private static final OperationExMapper MAPPER = new OperationExMapper(null, null);

    private OperationDTOFixture() {}

    /** An operation whose request is made of {@code parameters} only. */
    public static OperationDTO anOperationWith(ParameterDTO... parameters) {
        OperationDTO operation = new OperationDTO();
        operation.setParameters(Arrays.asList(parameters));
        return operation;
    }

    /** An operation whose request is made of {@code body} only. */
    public static OperationDTO anOperationWithBody(SchemaDTO body) {
        RequestBodyDTO requestBody = new RequestBodyDTO();
        requestBody.setContent(MediaType.APPLICATION_JSON);
        requestBody.setSchema(body);

        OperationDTO operation = new OperationDTO();
        operation.setRequestBody(requestBody);
        return operation;
    }

    public static ParameterDTO aParameter(ParamLocation location, SchemaDTO schema) {
        ParameterDTO parameter = new ParameterDTO();
        parameter.setName("param");
        parameter.setIn(location);
        parameter.setStyle(location == ParamLocation.QUERY || location == ParamLocation.COOKIE
                ? ParamStyle.FORM
                : ParamStyle.SIMPLE);
        parameter.setSchema(schema);
        return parameter;
    }

    /**
     * A pure HTTP request mapped the way a connection execution maps it.
     *
     * @param header request headers; a {@code Content-Type} also sets the expected response type
     * @param bodyFields JSON body fields, or {@code null} for no body
     */
    public static OperationDTO anHttpOperation(
            String httpMethod, String endpoint, Map<String, String> header, Map<String, Object> bodyFields) {
        return anHttpOperation(httpMethod, endpoint, header, bodyFields, "raw");
    }

    /**
     * A POST request with a body of kind {@code data}, mapped the way a connection execution maps
     * it.
     *
     * @param data the kind of body as the workflow editor stores it, e.g. {@code "graphql"}, or
     *     {@code null} for a body stored without one
     * @param contentType the {@code Content-Type} header of the request
     * @param bodyFields the body fields
     */
    public static OperationDTO aBodyOperation(String data, String contentType, Map<String, Object> bodyFields) {
        return anHttpOperation(
                "POST", "https://api.example.test/graphql", Map.of("Content-Type", contentType), bodyFields, data);
    }

    /** A GraphQL request: a JSON body of {@code query} and, if given, {@code variables}. */
    public static OperationDTO aGraphQlOperation(Map<String, Object> bodyFields) {
        return aBodyOperation("graphql", MediaType.APPLICATION_JSON_VALUE, bodyFields);
    }

    /** The same request as {@link #aGraphQlOperation(Map)}, sent to {@code endpoint}. */
    public static OperationDTO aGraphQlOperation(String endpoint, Map<String, Object> bodyFields) {
        return anHttpOperation(
                "POST", endpoint, Map.of("Content-Type", MediaType.APPLICATION_JSON_VALUE), bodyFields, "graphql");
    }

    /**
     * A POST method with an XML body, stored the way the workflow editor stores XML: every element
     * is an object of {@code __oc__attributes}, {@code __oc__value} and its child elements.
     *
     * @param bodyFields the stored body fields, the root element being the only one
     */
    public static MethodMng anXmlMethod(Map<String, Object> bodyFields) {
        return aMethod("POST", "https://api.example.test/soap",
                Map.of("Content-Type", MediaType.APPLICATION_XML_VALUE), bodyFields, "raw", "xml");
    }

    /** The method of {@link #anXmlMethod(Map)}, mapped the way a connection execution maps it. */
    public static OperationDTO anXmlOperation(Map<String, Object> bodyFields) {
        return MAPPER.toOperation(anXmlMethod(bodyFields), null);
    }

    private static OperationDTO anHttpOperation(
            String httpMethod, String endpoint, Map<String, String> header, Map<String, Object> bodyFields,
            String data) {
        return MAPPER.toOperation(aMethod(httpMethod, endpoint, header, bodyFields, data, "json"), null);
    }

    private static MethodMng aMethod(
            String httpMethod, String endpoint, Map<String, String> header, Map<String, Object> bodyFields,
            String data, String format) {
        RequestMng request = new RequestMng();
        request.setMethod(httpMethod);
        request.setEndpoint(endpoint);
        request.setHeader(new LinkedHashMap<>(header));
        if (bodyFields != null) {
            BodyMng body = new BodyMng();
            body.setType("object");
            body.setFormat(format);
            body.setData(data);
            body.setFields(new LinkedHashMap<>(bodyFields));
            request.setBody(body);
        }

        ResultMng success = new ResultMng();
        success.setStatus("200");
        ResponseMng response = new ResponseMng();
        response.setSuccess(success);

        MethodMng method = new MethodMng();
        method.setColor("#ababab");
        method.setName("testedMethod");
        method.setIndex("0");
        method.setRequest(request);
        method.setResponse(response);

        return method;
    }

    /** The same request as {@link #anHttpOperation}, sent by the connector {@code connectorId}. */
    public static OperationDTO aConnectorOperation(
            int connectorId, String httpMethod, String endpoint, Map<String, String> header) {
        OperationDTO operation = anHttpOperation(httpMethod, endpoint, header, null);
        operation.setConnectorId(connectorId);
        return operation;
    }

    /** A method as the workflow editor sends it, requesting with {@code httpMethod}. */
    public static MethodDTO aMethodDto(String httpMethod) {
        RequestDTO request = new RequestDTO();
        request.setMethod(httpMethod);

        MethodDTO method = new MethodDTO();
        method.setRequest(request);
        return method;
    }

    /** A POST method as the workflow editor sends it, with a GraphQL body made of {@code bodyFields}. */
    public static MethodDTO aGraphQlMethodDto(Map<String, Object> bodyFields) {
        BodyDTO body = new BodyDTO();
        body.setType("object");
        body.setFormat("json");
        body.setData("graphql");
        body.setFields(new LinkedHashMap<>(bodyFields));

        MethodDTO method = aMethodDto("POST");
        method.getRequest().setBody(body);
        return method;
    }
}
