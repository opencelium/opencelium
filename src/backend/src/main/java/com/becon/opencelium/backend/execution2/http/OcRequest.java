package com.becon.opencelium.backend.execution2.http;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

public class OcRequest {

    private String uri;
    private HttpMethod httpMethod;
    private HttpHeaders httpHeaders;
    private String body;

    private OcRequest(String uri, HttpMethod httpMethod, HttpHeaders httpHeaders, String body) {
        this.uri = uri;
        this.httpMethod = httpMethod;
        this.httpHeaders = httpHeaders;
        this.body = body;
    }

    public String getUri() {
        return uri;
    }

    public HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public HttpHeaders getHttpHeaders() {
        return httpHeaders;
    }

    public String getBody() {
        return body;
    }

    public static class Builder {
        private String uri;
        private HttpMethod httpMethod;
        private HttpHeaders httpHeaders;
        private String body;

        public Builder setUri(String uri) {
            this.uri = uri;
            return this;
        }

        public Builder setHttpMethod(HttpMethod httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        public Builder setHttpHeaders(HttpHeaders httpHeaders) {
            this.httpHeaders = httpHeaders;
            return this;
        }

        public Builder setBody(String body) {
            this.body = body;
            return this;
        }

        public OcRequest build() {
            return new OcRequest(uri, httpMethod, httpHeaders, body);
        }
    }
}
