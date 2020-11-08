package com.becon.opencelium.backend.execution2.builder;

import org.springframework.http.HttpHeaders;

public interface RequestBuilder<T> {

    RequestBuilder<T> setUrl(String url);
    RequestBuilder<T> setBody(String body);
    RequestBuilder<T> setHttpMethod(String method);
    RequestBuilder<T> setHttpHeader(HttpHeaders httpHeaders);
    T build();
}
