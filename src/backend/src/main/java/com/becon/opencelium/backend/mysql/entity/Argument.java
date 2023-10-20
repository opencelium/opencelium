package com.becon.opencelium.backend.mysql.entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "aggregator_argument")
public class Argument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;
    private String description;

    @ManyToOne
    @JoinColumn(name = "data_aggregator_id")
    private DataAggregator dataAggregator;

    @OneToMany(mappedBy = "argument", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<ExecutionArgument> executionArguments;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DataAggregator getDataAggregator() {
        return dataAggregator;
    }

    public void setDataAggregator(DataAggregator dataAggregator) {
        this.dataAggregator = dataAggregator;
    }

    public List<ExecutionArgument> getExecutionArguments() {
        return executionArguments;
    }

    public void setExecutionArguments(List<ExecutionArgument> executionArguments) {
        this.executionArguments = executionArguments;
    }
}
