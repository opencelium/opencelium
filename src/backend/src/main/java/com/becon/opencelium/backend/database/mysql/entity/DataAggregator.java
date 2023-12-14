package com.becon.opencelium.backend.database.mysql.entity;

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

    @Column(name = "is_active")
    private boolean active;

    @OneToMany(mappedBy = "dataAggregator", fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    private Set<Argument> args;

    public int getId() {
        return id;
    }

    public void setId(int id) {
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<Argument> getArgs() {
        return args;
    }

    public void setArgs(Set<Argument> args) {
        this.args = args;
    }
}
