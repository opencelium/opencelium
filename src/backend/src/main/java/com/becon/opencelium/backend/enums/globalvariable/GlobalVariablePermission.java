package com.becon.opencelium.backend.enums.globalvariable;

import java.util.EnumSet;
import java.util.Set;

/**
 * What a user may do with one global variable. The owner user and admins hold every permission;
 * other users hold what the owner granted them.
 */
public enum GlobalVariablePermission {
    /** See the variable and use it in workflows, connectors and notifications. */
    VIEW_USE,
    /** Change the variable. Includes {@link #VIEW_USE}. */
    EDIT,
    /** Delete the variable. Includes {@link #VIEW_USE}. */
    DELETE;

    /**
     * Returns the given permissions together with the ones they include: a user who may edit or
     * delete a variable may also view and use it.
     */
    public static Set<GlobalVariablePermission> withIncluded(Set<GlobalVariablePermission> granted) {
        if (granted.isEmpty()) {
            return EnumSet.noneOf(GlobalVariablePermission.class);
        }

        Set<GlobalVariablePermission> result = EnumSet.copyOf(granted);
        result.add(VIEW_USE);

        return result;
    }
}
