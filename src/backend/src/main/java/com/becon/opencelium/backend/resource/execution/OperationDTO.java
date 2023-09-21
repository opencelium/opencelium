package com.becon.opencelium.backend.resource.execution;

import jakarta.annotation.Resource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Resource
public class OperationDTO {
    private String path;
    private HttpMethod httpMethod;
    private String name;
    private String operationId;
    private String execOrder;
    private List<ParameterDTO> parameters;
    private RequestBodyDTO requestBody;
    private List<ResponseDTO> responses;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(HttpMethod httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOperationId() {
        return operationId;
    }

    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }

    public String getExecOrder() {
        return execOrder;
    }

    public void setExecOrder(String execOrder) {
        this.execOrder = execOrder;
    }

    public List<ParameterDTO> getParameters() {
        return parameters;
    }

    public void setParameters(List<ParameterDTO> parameters) {
        this.parameters = parameters;
    }

    public RequestBodyDTO getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(RequestBodyDTO requestBody) {
        this.requestBody = requestBody;
    }

    public List<ResponseDTO> getResponses() {
        return responses;
    }

    public void setResponses(List<ResponseDTO> responses) {
        this.responses = responses;
    }
}
