package com.becon.opencelium.backend.execution.service;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import java.util.Collection;

/**
 * Takes the snapshot of global variables a run reads.
 *
 * <p>The value of a secret is decrypted into the snapshot, and its entry is marked as a secret.
 * A secret that cannot be decrypted gets an entry that fails where its value is read.
 */
public interface GlobalVariableSnapshotService {

    /**
     * Reads the current value and version of every constant and mutable variable in the scope of
     * a workflow: the variables open to all workflows, the ones scoped to the category of the
     * workflow or to a category above it, and the ones scoped to the workflow itself.
     *
     * @param connectionId id of the workflow
     * @return the snapshot; empty when no variable is in scope
     * @throws IllegalStateException if the stored value of a variable that is not secret is not valid JSON
     */
    GlobalVariableSnapshot takeFor(long connectionId);

    /**
     * Reads the current value and version of every constant and mutable variable that is open to
     * all workflows. This is what a connector may use where no workflow runs: when the connector
     * is tested, when its health is checked and when a single method is tested.
     *
     * @return the snapshot; empty when no variable is open to all workflows
     * @throws IllegalStateException if the stored value of a variable that is not secret is not valid JSON
     */
    GlobalVariableSnapshot takeOpenToAll();

    /**
     * Takes the snapshot of variables the caller has already chosen, e.g. the ones a user may use
     * in a workflow when a single method of it is tested. Script variables hold code, not a value,
     * and are left out.
     *
     * @param variables the variables, each with its scope loaded
     * @return the snapshot; empty when no variable with a value is given
     * @throws IllegalStateException if the stored value of a variable that is not secret is not valid JSON
     */
    GlobalVariableSnapshot takeOf(Collection<GlobalVariable> variables);
}
