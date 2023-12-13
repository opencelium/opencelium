package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.LangEnum;
import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;

@Entity
@IdClass(ExecutionArgument.PK.class)
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

    @Column(name = "arg_value")
    private String value;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

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

    @Embeddable
    public static class PK implements Serializable {

        private Execution execution;
        private Argument argument;

        public PK() {
        }

        public PK(Execution execution, Argument argument) {
            this.execution = execution;
            this.argument = argument;
        }

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

        @Override
        public boolean equals(Object obj) {
            if ( this == obj ) {
                return true;
            }
            if ( obj == null || getClass() != obj.getClass() ) {
                return false;
            }
            PK pk = (PK) obj;
            return Objects.equals( execution, pk.execution ) &&
                    Objects.equals( argument, pk.argument );
        }

        @Override
        public int hashCode() {
            return Objects.hash(execution, argument);
        }
    }
}