package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.exception.GlobalVariableConflictException;

import java.util.List;

/**
 * What a change of a global variable would do to whatever uses it, asked before the change is
 * saved so the form can warn.
 *
 * @param blocking the usages that would make the save fail with 409, each with its reason:
 *                 IN_USE for a delete or a rename, OUT_OF_SCOPE for a workflow, a connector or
 *                 a notification the new scope leaves out. They have the shape of the {@code
 *                 blocking} list of that 409.
 * @param warnings usages the change affects without blocking it; empty for a constant
 */
public record GlobalVariableImpactDTO(
        List<GlobalVariableConflictException.Blocking> blocking,
        List<GlobalVariableConflictException.Blocking> warnings) {

    /**
     * Body of {@code POST /global-variable/{id}/impact}: the body the form is about to send to
     * the update, or {@code {"delete": true}}. Only what can break a usage is read from it.
     *
     * @param delete whether the variable is about to be deleted
     * @param name   the name the form holds; a different one is a rename
     * @param scope  the scope the form holds; left out keeps the scope
     */
    public record Request(Boolean delete, String name, GlobalVariableRequestDTO.Scope scope) {
    }
}
