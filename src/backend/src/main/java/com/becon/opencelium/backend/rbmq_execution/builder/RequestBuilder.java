package com.becon.opencelium.backend.rbmq_execution.builder;

import org.springframework.http.HttpHeaders;

public interface RequestBuilder<T> {

    RequestBuilder<T> setUrl(String url);
    RequestBuilder<T> setBody(String body);
    RequestBuilder<T> setHttpMethod(String method);
    RequestBuilder<T> setHttpHeader(HttpHeaders httpHeaders);
    T build();
}
