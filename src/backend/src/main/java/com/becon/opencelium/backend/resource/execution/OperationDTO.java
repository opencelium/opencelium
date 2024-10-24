package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import jakarta.annotation.Resource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Resource
public class OperationDTO {
    private String path;
    private HttpMethod httpMethod;
    private String name;
    private String operationId;
    private String invoker; // TODO: need for RequestEntity building when invoker = CheckMK, will be removed in future refactoring
    private String execOrder;
    private Integer aggregatorId;
    private List<ParameterDTO> parameters;
    private RequestBodyDTO requestBody;
    private List<ResponseDTO> responses;
    private OpType operationType;
    private Pagination pagination;

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

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }

    public String getExecOrder() {
        return execOrder;
    }

    public void setExecOrder(String execOrder) {
        this.execOrder = execOrder;
    }

    public Integer getAggregatorId() {
        return aggregatorId;
    }

    public void setAggregatorId(Integer aggregatorId) {
        this.aggregatorId = aggregatorId;
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

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public OpType getOperationType() {
        return operationType;
    }

    public void setOperationType(OpType operationType) {
        this.operationType = operationType;
    }
}
