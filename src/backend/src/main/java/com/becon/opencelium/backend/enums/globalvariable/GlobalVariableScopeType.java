package com.becon.opencelium.backend.enums.globalvariable;

/**
 * Which workflows may use a global variable.
 */
public enum GlobalVariableScopeType {
    /** Every workflow. */
    ALL,
    /** Workflows of the chosen categories and of their subcategories. */
    CATEGORIES,
    /** Only the chosen workflows. */
    WORKFLOWS
}
