package com.becon.opencelium.backend.enums.globalvariable;

/**
 * What a global variable is. The kind is chosen when the variable is created and never changes.
 */
public enum GlobalVariableKind {
    /** Only users change it. Runs read it and never write it. */
    CONSTANT,
    /** Starts with a value a user sets; its owner workflow changes it during runs. */
    MUTABLE,
    /** A reusable function that returns a value on every call. */
    SCRIPT
}
