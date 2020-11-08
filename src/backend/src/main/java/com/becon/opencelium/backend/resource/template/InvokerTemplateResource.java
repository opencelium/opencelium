package com.becon.opencelium.backend.resource.template;

import com.becon.opencelium.backend.resource.connector.FunctionResource;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class InvokerTemplateResource {

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
