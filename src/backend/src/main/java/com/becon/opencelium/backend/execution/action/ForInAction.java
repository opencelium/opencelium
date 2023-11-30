package com.becon.opencelium.backend.execution.action;

import com.becon.opencelium.backend.execution.ExecutionManager;

public class ForInAction implements Action, Loop {
    private String loopingObject;
    private String counterName;
    private Integer counterValue;
    private ExecutionManager executionManager;

    @Override
    public boolean execute() {
        return false;
    }
}
