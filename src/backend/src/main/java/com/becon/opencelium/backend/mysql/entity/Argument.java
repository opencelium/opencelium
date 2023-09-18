package com.becon.opencelium.backend.mysql.entity;

import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name = "aggregator_argument")
public class Argument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @ManyToOne
    @JoinColumn(name = "data_aggregator_id")
    private DataAggregator dataAggregator;

    @OneToMany(mappedBy = "argument", fetch = FetchType.EAGER)
    private Set<ExecutionArgument> executionArguments;

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

    public Set<ExecutionArgument> getExecutionArguments() {
        return executionArguments;
    }

    public void setExecutionArguments(Set<ExecutionArgument> executionArguments) {
        this.executionArguments = executionArguments;
    }
}
