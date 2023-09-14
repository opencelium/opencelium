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
    List<ParameterDTO> parameters;
    private RequestBodyDTO requestBody;
    private List<ResponseDTO> responses;

}
