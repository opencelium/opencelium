package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Operation;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public interface ExecutionManager {
    Map<String, Object> getQueryParams();
    LinkedHashMap<String, String> getLoops();
    String generateKey();
    Map<String, String> getRequestData(Integer ctorId);
    Optional<Operation> findOperationByColor(String color);
    Object executeScript(String bindId);
    Object getValue(String ref);
    void addOperation(Operation operation);
    void setCurrentCtorId(Integer ctorId);
}
