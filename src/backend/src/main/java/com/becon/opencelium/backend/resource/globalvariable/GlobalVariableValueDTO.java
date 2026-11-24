package com.becon.opencelium.backend.resource.globalvariable;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The current value of one global variable, as a screen that shows values polls it.
 *
 * @param version  the version of the definition; it changes whenever a user saves the variable
 * @param revision how often the current value of a mutable variable was set since creation;
 *                 always 0 for the other kinds
 * @param value    the value a run reads now, as real JSON: the current value of a mutable
 *                 variable, the last saved value otherwise; always {@code null} for a secret
 * @param updatedAt when {@code value} was set
 * @param updatedBy the user who set {@code value}; {@code null} when a run wrote it
 * @param beingUpdatedBy the run of the owner workflow while one goes, for a mutable variable
 *                  only; {@code null} otherwise
 */
public record GlobalVariableValueDTO(
        Long id,
        long version,
        long revision,
        JsonNode value,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt,
        GlobalVariableDTO.Actor updatedBy,
        GlobalVariableDTO.BeingUpdatedBy beingUpdatedBy) {

    /**
     * Returns the entity tag of a list of values: it is built from the ids, the versions, the
     * revisions and the runs that update them, so it stays the same exactly as long as no listed
     * variable changed, no current value was set, no run of an owner workflow started or ended and
     * none joined or left the list.
     */
    public static String etagOf(List<GlobalVariableValueDTO> values) {
        String identity = values.stream()
                .map(value -> value.id() + ":" + value.version() + ":" + value.revision() + ":" + runOf(value))
                .collect(Collectors.joining(","));

        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(identity.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private static String runOf(GlobalVariableValueDTO value) {
        GlobalVariableDTO.BeingUpdatedBy run = value.beingUpdatedBy();
        return run == null ? "-" : run.workflowId() + "@" + run.executionId() + "@" + run.startedAt();
    }
}
