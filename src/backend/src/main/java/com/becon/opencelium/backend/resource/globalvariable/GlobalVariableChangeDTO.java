package com.becon.opencelium.backend.resource.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;

/**
 * One entry of the change log of a global variable.
 *
 * @param oldValue      value before the change as real JSON; {@code null} for a CONFIG or
 *                      PERMISSIONS change
 * @param newValue      value after the change as real JSON; {@code null} for a CONFIG or
 *                      PERMISSIONS change
 * @param changedFields the fields a CONFIG or PERMISSIONS change touched; {@code null} otherwise
 * @param restorable    whether the variable can be set back to the value this entry saved
 */
public record GlobalVariableChangeDTO(
        Long id,
        GlobalVariableChange.Type changeType,
        Long versionFrom,
        Long versionTo,
        JsonNode oldValue,
        JsonNode newValue,
        List<ChangedField> changedFields,
        GlobalVariableDTO.Actor actor,
        GlobalVariableChange.Result result,
        String reason,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant changedAt,
        boolean restorable) {

    /** One field with its content before and after the change. */
    public record ChangedField(String field, JsonNode old, @JsonProperty("new") JsonNode updated) {
    }
}
