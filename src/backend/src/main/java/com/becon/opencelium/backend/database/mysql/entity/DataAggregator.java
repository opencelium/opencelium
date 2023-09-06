package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "data_aggregator")
public class DataAggregator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "json")
    private String script;

    @OneToMany(mappedBy = "dataAggregator", cascade = CascadeType.ALL)
    private List<Argument> args;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public List<Argument> getArgs() {
        return args;
    }

    public void setArgs(List<Argument> args) {
        this.args = args;
    }
}
