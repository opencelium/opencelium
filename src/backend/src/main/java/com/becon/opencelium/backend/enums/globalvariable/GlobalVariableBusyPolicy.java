package com.becon.opencelium.backend.enums.globalvariable;

/**
 * What happens to a second start of a workflow that uses a mutable variable while an execution
 * of that workflow is still running. Set per mutable variable; a workflow that uses several of
 * them is refused as soon as one says {@link #REFUSE}.
 */
public enum GlobalVariableBusyPolicy {
    /** The second execution waits and starts when the running one ends. The default. */
    QUEUE,
    /** The second execution does not start. */
    REFUSE
}
