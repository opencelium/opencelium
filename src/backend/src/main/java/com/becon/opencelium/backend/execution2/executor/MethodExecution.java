package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.execution2.container.Method;
import com.becon.opencelium.backend.execution2.mediator.ExecutionContext;
import com.becon.opencelium.backend.execution2.factory.WebServiceFactory;
import com.becon.opencelium.backend.execution2.http.OcRequest;
import com.becon.opencelium.backend.execution2.http.WebServiceClient;
import com.becon.opencelium.backend.execution2.service.MethodService;
import com.becon.opencelium.backend.execution2.service.MethodServiceImp;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

public class MethodExecution implements Execution {

    @Override
    public void start(ExecutionContext executionContext) {
        if (executionContext.getAction().getClass() != MethodNode.class){
            return;
        }

        MethodNode methodNode = (MethodNode) executionContext.getAction();
        MethodService methodService = new MethodServiceImp(executionContext, methodNode);

        String uri = methodService.getUri();
        HttpMethod httpMethod = methodService.getHttpMethod();
        String message = methodService.getMessage();
        HttpHeaders headers = methodService.getHeader();

        OcRequest request = new OcRequest.Builder()
                .setUri(uri)
                .setHttpMethod(httpMethod)
                .setHttpHeaders(headers)
                .setBody(message)
                .build();

        String webServiceType = executionContext.getCurrentCtor().getWebService();
        WebServiceClient<String> webServiceClient = new WebServiceFactory<String>().newService(webServiceType);
        ResponseEntity<String> responseEntity =  webServiceClient.send(request, String.class);

        //check either a response is success or fail.

        // save response in container
        String color = methodNode.getColor();
//        Method method = new Method()
    }



}
