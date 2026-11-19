package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Body of {@code POST /global-variable} and {@code PUT /global-variable/{id}}.
 *
 * @param name        unique name: letters, digits and {@code _}, starting with a letter, at most
 *                    64 characters
 * @param kind        kind of the variable; it cannot change after creation
 * @param description free text, at most 512 characters
 * @param value       the value as real JSON of any type; left out or {@code null} is JSON null
 * @param secret      whether the value is hidden after saving
 * @param scope       which workflows may use the variable
 * @param version     the version the edit form loaded; required on update, ignored on create
 */
public record GlobalVariableRequestDTO(
        String name,
        GlobalVariableKind kind,
        String description,
        @Schema(description = "Any JSON value: string, number, boolean, null, array or map") JsonNode value,
        Boolean secret,
        Scope scope,
        Long version) {

    /**
     * Scope of the variable. Only the list that belongs to {@code type} is read: {@code
     * categoryIds} for CATEGORIES, {@code workflowIds} for WORKFLOWS, none for ALL.
     */
    public record Scope(GlobalVariableScopeType type, List<Long> categoryIds, List<Long> workflowIds) {
    }
}
