package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * One global variable with everything the detail page and the edit form show.
 *
 * @param value         the value as real JSON; always {@code null} for a secret
 * @param hasValue      whether a value is stored, which a secret does not show otherwise
 * @param ownerUser     the creator, or {@code null} once that user is deleted
 * @param myPermissions what the calling user may do with this variable
 * @param version       goes up by one on every saved change; send it back on update
 */
public record GlobalVariableDTO(
        Long id,
        String name,
        GlobalVariableKind kind,
        String description,
        JsonNode value,
        boolean secret,
        boolean hasValue,
        Scope scope,
        UserRef ownerUser,
        Set<GlobalVariablePermission> myPermissions,
        long version,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant createdAt,
        Actor createdBy,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt,
        Actor updatedBy) {

    /** A user by id and display name. */
    public record UserRef(Integer id, String name) {
    }

    /** Who created or changed something: for now always a user. */
    public record Actor(String type, Integer id, String name) {

        public static final String USER = "USER";

        public static Actor user(Integer id, String name) {
            return new Actor(USER, id, name);
        }
    }

    /** Which workflows may use the variable, with the names the UI shows. */
    public record Scope(GlobalVariableScopeType type, List<CategoryRef> categories, List<WorkflowRef> workflows) {
    }

    /** A category in scope; {@code name} is {@code null} if the category no longer exists. */
    public record CategoryRef(Long id, String name) {
    }

    /** A workflow in scope; {@code title} is {@code null} if the workflow no longer exists. */
    public record WorkflowRef(Long id, String title) {
    }
}
