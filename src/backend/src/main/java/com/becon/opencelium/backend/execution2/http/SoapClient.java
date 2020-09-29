package com.becon.opencelium.backend.execution2.http;

import com.becon.opencelium.backend.execution2.builder.RequestBuilder;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

public class SoapClient<T> implements WebServiceClient<T>{

    @Override
    public ResponseEntity<T> send(OcRequest request, Class<T> responseType) {
        return null;
    }
}
