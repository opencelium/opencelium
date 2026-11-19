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
 * @param value       the value as real JSON of any type; left out or {@code null} is JSON null,
 *                    except on an update of a secret, where it keeps the hidden value
 * @param secret      whether the value is hidden after saving; left out on an update keeps the
 *                    flag, and clearing it needs a new value
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

    // a request body is logged through this, e.g. by Spring MVC at DEBUG: a value that may be a
    // secret, which an update that leaves the flag out may be, stays out
    @Override
    public String toString() {
        Object shownValue = Boolean.FALSE.equals(secret) ? value : "****";

        return "GlobalVariableRequestDTO[name=%s, kind=%s, description=%s, value=%s, secret=%s, scope=%s, version=%s]"
                .formatted(name, kind, description, shownValue, secret, scope, version);
    }

    /**
     * Scope of the variable. Only the list that belongs to {@code type} is read: {@code
     * categoryIds} for CATEGORIES, {@code workflowIds} for WORKFLOWS, none for ALL.
     */
    public record Scope(GlobalVariableScopeType type, List<Long> categoryIds, List<Long> workflowIds) {
    }
}
