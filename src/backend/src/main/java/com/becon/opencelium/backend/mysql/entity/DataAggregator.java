package com.becon.opencelium.backend.mysql.entity;

import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name = "data_aggregator")
public class DataAggregator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Column(columnDefinition = "json")
    private String script;

    @OneToMany(mappedBy = "dataAggregator", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Set<Argument> args;

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

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public Set<Argument> getArgs() {
        return args;
    }

    public void setArgs(Set<Argument> args) {
        this.args = args;
    }
}
