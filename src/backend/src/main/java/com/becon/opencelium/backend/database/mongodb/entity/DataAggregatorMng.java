package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.annotation.Id;

import java.util.List;

public class DataAggregatorMng {
    @Id
    private String id;
    private String name;
    private List<ArgumentMng> args;
    private String script;

    public DataAggregatorMng() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ArgumentMng> getArgs() {
        return args;
    }

    public void setArgs(List<ArgumentMng> args) {
        this.args = args;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }
}
