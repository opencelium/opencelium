package com.becon.opencelium.backend.resource.execution;

import org.springframework.http.MediaType;

public class RequestBodyDTO {
    private boolean required;
    private MediaType contentType;
    private SchemaDTO schema;
}
