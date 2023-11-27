package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.action.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;

import java.util.Map;

public interface ExecutionManager {
    String getQueryParam(String param);

    void addLoop(Loop loop);

    Map<String, String> getRequiredData(String ctorId);

    Operation findOperationByColor(String color);
}
