package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.annotation.JsonInclude;

import javax.annotation.Resource;
import java.util.List;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DiffFilesResource {
    List<String> files_name;

    public DiffFilesResource() {
    }

    public DiffFilesResource(List<String> files_name) {
        this.files_name = files_name;
    }

    public List<String> getFiles_name() {
        return files_name;
    }

    public void setFiles_name(List<String> files_name) {
        this.files_name = files_name;
    }
}
