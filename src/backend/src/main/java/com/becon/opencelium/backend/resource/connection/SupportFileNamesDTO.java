package com.becon.opencelium.backend.resource.connection;

import jakarta.annotation.Resource;

import java.util.ArrayList;
import java.util.List;

@Resource
public class SupportFileNamesDTO {
    private List<String> filenames = new ArrayList<>();

    public List<String> getFilenames() {
        return filenames;
    }

    public void setFilenames(List<String> filenames) {
        this.filenames = filenames;
    }
}
