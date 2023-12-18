package com.becon.opencelium.backend.resource.execution;

public class OperatorEx implements Executable{
    private String id;
    private String type;
    private String index;
    private String iterator;
    private ConditionEx condition;

    public OperatorEx() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getIterator() {
        return iterator;
    }

    public void setIterator(String iterator) {
        this.iterator = iterator;
    }

    public ConditionEx getCondition() {
        return condition;
    }

    public void setCondition(ConditionEx condition) {
        this.condition = condition;
    }

    @Override
    public String getExecOrder() {
        return this.index;
    }
}
