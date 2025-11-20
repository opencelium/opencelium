package com.becon.opencelium.backend.database.mongodb.criteria;

public class ConnectionCriteria {
    private boolean flowcharts;
    private boolean methods;
    private boolean operators;
    private boolean executionPlan;
    private boolean mappers;
    private boolean ui;

    // --- Getters and Setters ---
    public boolean isFlowcharts() { return flowcharts; }
    public void setFlowcharts(boolean flowcharts) { this.flowcharts = flowcharts; }

    public boolean isMethods() { return methods; }
    public void setMethods(boolean methods) { this.methods = methods; }

    public boolean isOperators() { return operators; }
    public void setOperators(boolean operators) { this.operators = operators; }

    public boolean isExecutionPlan() { return executionPlan; }
    public void setExecutionPlan(boolean executionPlan) { this.executionPlan = executionPlan; }

    public boolean isMappers() { return mappers; }
    public void setMappers(boolean mappers) { this.mappers = mappers; }

    public boolean isUi() { return ui; }
    public void setUi(boolean ui) { this.ui = ui; }

    // --- Builder pattern ---
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ConnectionCriteria criteria;

        private Builder() {
            this.criteria = new ConnectionCriteria();
        }

        public Builder flowcharts(boolean value) {
            criteria.setFlowcharts(value);
            return this;
        }

        public Builder methods(boolean value) {
            criteria.setMethods(value);
            return this;
        }


        public Builder operators(boolean value) {
            criteria.setOperators(value);
            return this;
        }

        public Builder executionPlan(boolean value) {
            criteria.setExecutionPlan(value);
            return this;
        }

        public Builder mappers(boolean value) {
            criteria.setMappers(value);
            return this;
        }

        public Builder ui(boolean value) {
            criteria.setUi(value);
            return this;
        }

        public ConnectionCriteria build() {
            return criteria;
        }
    }
}
