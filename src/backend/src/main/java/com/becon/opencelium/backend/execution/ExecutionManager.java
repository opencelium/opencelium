package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Operation;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public interface ExecutionManager {
    Map<String, Object> getQueryParams();

    LinkedHashMap<String, String> getLoops();

    Map<String, String> getRequiredData(String ctorId);

    Optional<Operation> findOperationByColor(String color);
}
