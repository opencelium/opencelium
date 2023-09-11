package com.becon.opencelium.backend.resource.connection.aggregator;

import java.util.List;
import java.util.Set;

public class DataAggregatorDTO {
    private Integer id;
    private String name;
    private Set<ArgumentDTO> args;
    private String script;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<ArgumentDTO> getArgs() {
        return args;
    }

    public void setArgs(Set<ArgumentDTO> args) {
        this.args = args;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }
}
