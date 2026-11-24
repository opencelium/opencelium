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
        RequestMng request = new RequestMng();
        request.setMethod(httpMethod);
        request.setEndpoint(endpoint);
        request.setHeader(new LinkedHashMap<>(header));
        if (bodyFields != null) {
            BodyMng body = new BodyMng();
            body.setType("object");
            body.setFormat("json");
            body.setData("raw");
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

        return MAPPER.toOperation(method, null);
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
}
