package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "data_aggregator")
public class DataAggregatorMng {
    @Id
    private String id;
    private String name;
    @DBRef
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
