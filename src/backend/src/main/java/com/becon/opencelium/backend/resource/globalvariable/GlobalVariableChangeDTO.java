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
 *                      PERMISSIONS change; the string {@code "••••"} for the value of a secret
 *                      and for every value of a variable that is a secret now
 * @param newValue      value after the change as real JSON, masked like {@code oldValue};
 *                      {@code null} for a CONFIG or PERMISSIONS change
 * @param changedFields the fields a CONFIG or PERMISSIONS change touched; {@code null} otherwise
 * @param actor         the user who made the change; for a RUN_WRITE entry the workflow whose
 *                      run wrote, with type {@code WORKFLOW}
 * @param executionId   the execution that wrote, for a RUN_WRITE entry; {@code null} otherwise
 * @param writeCount    how many times that run wrote the variable: the entry sums them up, with
 *                      {@code oldValue} from before the first write and {@code newValue} from
 *                      the last; {@code null} for any other entry
 * @param restorable    whether the variable can be set back to the value this entry saved;
 *                      never for a masked value or a RUN_WRITE entry
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
        Long executionId,
        Integer writeCount,
        GlobalVariableChange.Result result,
        String reason,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant changedAt,
        boolean restorable) {

    /** One field with its content before and after the change. */
    public record ChangedField(String field, JsonNode old, @JsonProperty("new") JsonNode updated) {
    }
}
