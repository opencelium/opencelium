package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.Set;

/**
 * One row of the list of global variables.
 *
 * @param valuePreview  the value as JSON text, cut to its first 100 characters; {@code null}
 *                      for a secret
 * @param usageCount    number of places that use the variable; while it is above zero the
 *                      variable can be neither deleted nor renamed
 * @param myPermissions what the calling user may do with this variable
 */
public record GlobalVariableListItemDTO(
        Long id,
        String name,
        GlobalVariableKind kind,
        String description,
        boolean secret,
        String valuePreview,
        GlobalVariableScopeType scopeType,
        long usageCount,
        Set<GlobalVariablePermission> myPermissions,
        long version,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt,
        GlobalVariableDTO.Actor updatedBy) {
}
