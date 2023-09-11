package com.becon.opencelium.backend.mysql.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "execution_argument")
public class ExecutionArgument {

    @Id
    @ManyToOne
    @JoinColumn(name = "execution_id")
    private Execution execution;

    @Id
    @ManyToOne
    @JoinColumn(name = "aggregator_argument_id")
    private Argument argument;

    private String value;

    public Execution getExecution() {
        return execution;
    }

    public void setExecution(Execution execution) {
        this.execution = execution;
    }

    public Argument getArgument() {
        return argument;
    }

    public void setArgument(Argument argument) {
        this.argument = argument;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
