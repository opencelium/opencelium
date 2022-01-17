package com.becon.opencelium.backend.rbmq_execution.http;

import org.springframework.http.ResponseEntity;

public class SoapClient<T> implements WebServiceClient<T>{

    @Override
    public ResponseEntity<T> send(OcRequest request, Class<T> responseType) {
        return null;
    }
}
