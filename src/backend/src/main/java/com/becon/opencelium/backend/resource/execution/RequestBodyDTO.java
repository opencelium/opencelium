package com.becon.opencelium.backend.resource.execution;

import org.springframework.http.MediaType;

public class RequestBodyDTO {
    private MediaType content;
    private SchemaDTO schema;

    public MediaType getContent() {
        return content;
    }

    public void setContent(MediaType content) {
        this.content = content;
    }

    public SchemaDTO getSchema() {
        return schema;
    }

    public void setSchema(SchemaDTO schema) {
        this.schema = schema;
    }
}
