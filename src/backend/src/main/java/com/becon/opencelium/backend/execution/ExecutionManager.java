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

    /**
     * Writes a mutable global variable. The rest of the run reads the new value; a run of the
     * owner workflow also stores it, a test run keeps it in its own copy only.
     *
     * @param name  name of the variable, without braces or path
     * @param value the value in its JSON type
     * @throws com.becon.opencelium.backend.exception.GlobalVariableNotFoundException if the
     *     variable does not exist or the workflow is outside its scope
     * @throws IllegalStateException if this run may not write the variable
     */
    void writeGlobal(String name, Object value);

    /**
     * Writes the mutable global variables a method names, in the order it names them, once the
     * method has responded.
     *
     * @param writes the targets as {@code global.name} and their values: a value that holds a
     *               reference is resolved like any other, another value is JSON text, or plain
     *               text when it is not JSON
     * @param source what writes, for the error message, e.g. the name of the method
     * @throws IllegalStateException if a target is not {@code global.name} or this run may
     *     not write the variable
     */
    void applyGlobalWrites(Map<String, String> writes, String source);

    void addOperation(Operation operation);
    List<Operation> getAllOperations();
    void setCurrentCtorId(Integer ctorId);
    void setPagination(Pagination pagination);
    String getPaginationParamValue(PageParam pageParam);
}
