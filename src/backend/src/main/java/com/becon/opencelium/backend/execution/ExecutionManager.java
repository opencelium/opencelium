package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ExecutionManager {
    Map<String, Object> getQueryParams();
    List<Loop> getLoops();
    String generateKey(int loopDepth);
    Map<String, String> getRequestData(Integer ctorId);
    Optional<Operation> findOperationByColor(String color);
    Object executeScript(String bindId);
    Object getValue(String ref);
    void addOperation(Operation operation);
    void setCurrentCtorId(Integer ctorId);
    void setPagination(Pagination pagination);
}
