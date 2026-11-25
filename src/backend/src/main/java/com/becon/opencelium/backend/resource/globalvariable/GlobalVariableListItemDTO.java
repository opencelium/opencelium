package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * One row of the list of global variables.
 *
 * @param valuePreview  the value as JSON text, cut to its first 100 characters; {@code null}
 *                      for a secret and a script
 * @param language      the language of a script, e.g. {@code js}; {@code null} for the other
 *                      kinds
 * @param parameterCount how many parameters a script declares; {@code null} for the other kinds
 * @param usageCount    number of places that use the variable; while it is above zero the
 *                      variable can be neither deleted nor renamed
 * @param myPermissions what the calling user may do with this variable
 * @param beingUpdatedBy the runs of owner workflows that go now, ordered by workflow id, for a
 *                      mutable variable; several owners may run at the same time. Empty when
 *                      none runs and for the other kinds
 */
public record GlobalVariableListItemDTO(
        Long id,
        String name,
        GlobalVariableKind kind,
        String description,
        boolean secret,
        String valuePreview,
        String language,
        Integer parameterCount,
        GlobalVariableScopeType scopeType,
        long usageCount,
        Set<GlobalVariablePermission> myPermissions,
        long version,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt,
        GlobalVariableDTO.Actor updatedBy,
        List<GlobalVariableDTO.BeingUpdatedBy> beingUpdatedBy) {

    public GlobalVariableListItemDTO {
        beingUpdatedBy = beingUpdatedBy == null ? List.of() : List.copyOf(beingUpdatedBy);
    }
}
