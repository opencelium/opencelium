package com.becon.opencelium.backend.execution.logger.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * One global variable of the snapshot a run read, as the execution log returns it.
 *
 * <p>A field that is {@code null} is left out of the response; a variable whose value is JSON
 * {@code null} still has {@code "value": null}.
 *
 * @param name         name of the variable
 * @param version      version of the variable when the run took its snapshot
 * @param value        the value as JSON; the text {@code "••••"} for a secret; left out when
 *                     {@code valueOmitted} is set
 * @param valueOmitted {@code true} when the log left the value out because of its size; left out
 *                     otherwise
 * @param valueBytes   bytes of compact JSON of the value the log left out; left out otherwise
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GlobalSnapshotEntryDTO(
        @Schema(example = "idoitUrl") String name,
        @Schema(example = "4") Long version,
        @Schema(description = "The value as JSON; \"••••\" for a secret", example = "\"https://cmdb.example\"")
        JsonNode value,
        @Schema(description = "Present and true when the value was too large to be logged")
        Boolean valueOmitted,
        @Schema(description = "Bytes of the value that was not logged")
        Long valueBytes) {

    /** Creates the entry of a variable whose value the log holds. */
    public static GlobalSnapshotEntryDTO withValue(String name, Long version, JsonNode value) {
        return new GlobalSnapshotEntryDTO(name, version, value, null, null);
    }

    /** Creates the entry of a variable whose value the log left out. */
    public static GlobalSnapshotEntryDTO withoutValue(String name, Long version, Long valueBytes) {
        return new GlobalSnapshotEntryDTO(name, version, null, Boolean.TRUE, valueBytes);
    }
}
