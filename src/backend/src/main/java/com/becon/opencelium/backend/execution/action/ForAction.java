package com.becon.opencelium.backend.execution.action;

import com.becon.opencelium.backend.execution.ExecutionManager;

public class ForAction implements Action, Loop {
    private String loopingArray;
    private String counterName;
    private Integer counterValue;
    private ExecutionManager executionManager;
}
