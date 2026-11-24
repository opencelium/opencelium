package com.becon.opencelium.backend.execution.globalvariable;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Remembers which workflow the copy of a test run was made from.
 *
 * <p>A test run saves the workflow under a new id, runs that copy and deletes it. A global
 * variable that is scoped to chosen workflows lists the workflow itself, never the copy, so the
 * copy is checked and run with the scope of the workflow it was made from.
 *
 * <p>The link lives as long as the copy does, and only in this instance, which is the one that
 * starts the run. A copy without a link, for example of a workflow that was never saved, has
 * only its own scope.
 */
@Component
public class TestRunOrigins {

    private final Map<Long, Long> originByCopy = new ConcurrentHashMap<>();

    /** Records that the workflow {@code copyId} is a test copy of the workflow {@code originId}. */
    public void register(long copyId, long originId) {
        originByCopy.put(copyId, originId);
    }

    /**
     * Returns the workflow whose scope decides which variables {@code connectionId} may use: the
     * workflow a test copy was made from, or the workflow itself.
     */
    public long scopeWorkflowOf(long connectionId) {
        return originByCopy.getOrDefault(connectionId, connectionId);
    }

    /** Drops the link of a copy that is being deleted; a workflow that is no copy has none. */
    public void forget(long copyId) {
        originByCopy.remove(copyId);
    }
}
