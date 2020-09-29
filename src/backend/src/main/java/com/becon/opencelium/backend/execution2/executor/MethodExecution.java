package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.execution2.data.ExecutionData;
import com.becon.opencelium.backend.execution2.factory.WebServiceFactory;
import com.becon.opencelium.backend.execution2.http.OcRequest;
import com.becon.opencelium.backend.execution2.http.WebServiceClient;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

public class MethodExecution implements Execution {

    @Override
    public void start(ExecutionData executionData) {
        if (executionData.getAction().getClass() != MethodNode.class){
            return;
        }

        MethodNode methodNode = (MethodNode) executionData.getAction();
        String uri = "";
        HttpMethod httpMethod = HttpMethod.GET;
        String message = "";
        HttpHeaders headers = new HttpHeaders();

        OcRequest request = new OcRequest.Builder()
                .setUri(uri)
                .setHttpMethod(httpMethod)
                .setHttpHeaders(headers)
                .setBody(message)
                .build();

        String webServiceType = executionData.getCurrentCtor().getWebService();
        WebServiceClient<String> webServiceClient = new WebServiceFactory<String>().newService(webServiceType);
        ResponseEntity<String> responseEntity =  webServiceClient.send(request, String.class);

        // save response in container
    }


}
