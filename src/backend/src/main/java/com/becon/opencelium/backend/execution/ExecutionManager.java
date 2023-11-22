package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.action.Action;
import com.becon.opencelium.backend.execution.action.Operation;
import com.becon.opencelium.backend.execution.oc721.RequiredData;

public interface ExecutionManager {
    String getQueryParam(String param);
    void addAction(Action action);
    RequiredData getRequiredData(String ctorId);
    Operation findOperationByColor(String color);
}
