package com.becon.opencelium.backend.resource.template;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InvokerTemplateResource {
    public InvokerTemplateResource() {
    }

    public InvokerTemplateResource(String name) {
        this.name = name;
    }

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
