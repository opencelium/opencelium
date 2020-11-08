package com.becon.opencelium.backend.execution2.service;

import com.becon.opencelium.backend.execution2.mediator.ExecutionContext;
import com.becon.opencelium.backend.neo4j.entity.BodyNode;
import com.becon.opencelium.backend.neo4j.entity.HeaderNode;
import com.becon.opencelium.backend.neo4j.entity.ItemNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.util.List;

public class MethodServiceImp implements MethodService {

    private ExecutionContext executionContext;
    private MethodNode methodNode;

    public MethodServiceImp(ExecutionContext executionContext, MethodNode methodNode) {
        this.executionContext = executionContext;
        this.methodNode = methodNode;
    }

    @Override
    public String getUri() {
        String uri = methodNode.getRequestNode().getEndpoint();
        return null;
    }

    @Override
    public HttpHeaders getHeader() {
        HeaderNode headerNode = methodNode.getRequestNode().getHeaderNode();
        List<ItemNode> items = headerNode.getItems();
        HttpHeaders httpHeaders = new HttpHeaders();
        return null;
    }

    @Override
    public HttpMethod getHttpMethod() {
        String httpMethod = methodNode.getRequestNode().getMethod();
        switch (httpMethod){
            case "POST":
                return HttpMethod.POST;
            case "DELETE":
                return HttpMethod.DELETE;
            case "PUT":
                return HttpMethod.PUT;
            case "GET":
                return HttpMethod.GET;
            default:
                throw new RuntimeException("Http method " + httpMethod + " not found");
        }
    }

    @Override
    public String getMessage() {
        BodyNode bodyNode = methodNode.getRequestNode().getBodyNode();
        return null;
    }
}
