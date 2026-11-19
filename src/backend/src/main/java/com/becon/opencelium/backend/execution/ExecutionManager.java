package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ExecutionManager {
    Map<String, Object> getWebhookVars();
    List<Loop> getLoops();
    String generateKey(int loopDepth);
    RestTemplate resolveRestTemplate();
    Pagination resolvePagination();
    Map<String, String> getRequestData(Integer ctorId);
    Optional<Operation> findOperationByColor(String color);
    Object executeScript(String bindId);
    Object getValue(String ref);

    /**
     * Reads a global variable from the snapshot the run took when it started.
     *
     * @return the value in its JSON type: a string, a number, a boolean, {@code null}, a list or a
     *     map; {@code null} too when the path of the reference leads nowhere
     * @throws com.becon.opencelium.backend.exception.GlobalVariableNotFoundException if the
     *     variable does not exist or the workflow is outside its scope
     */
    Object getGlobalValue(GlobalReference reference);

    void addOperation(Operation operation);
    List<Operation> getAllOperations();
    void setCurrentCtorId(Integer ctorId);
    void setPagination(Pagination pagination);
    String getPaginationParamValue(PageParam pageParam);
}
