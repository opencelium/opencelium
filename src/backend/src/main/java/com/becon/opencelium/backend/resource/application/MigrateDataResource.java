package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MigrateDataResource {
    private String version;

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
