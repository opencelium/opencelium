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
 * @param version the version the value belongs to; it changes whenever the variable does
 * @param value   the last saved value as real JSON; always {@code null} for a secret
 */
public record GlobalVariableValueDTO(
        Long id,
        long version,
        JsonNode value,
        @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt,
        GlobalVariableDTO.Actor updatedBy) {

    /**
     * Returns the entity tag of a list of values: it is built from the ids and the versions, so
     * it stays the same exactly as long as no listed variable changed and none joined or left
     * the list.
     */
    public static String etagOf(List<GlobalVariableValueDTO> values) {
        String identity = values.stream()
                .map(value -> value.id() + ":" + value.version())
                .collect(Collectors.joining(","));

        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(identity.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest, 0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
