package io.opencelium.common.secret;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Objects;

public final class SecretValue {

    private static final String MASK = "SecretValue[***]";

    private final byte[] bytes;

    private SecretValue(byte[] bytes) {
        this.bytes = bytes;
    }

    /** Also how a secret arrives in a request body — an API may receive one, but never return it. */
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static SecretValue of(String value) {
        Objects.requireNonNull(value, "secret value must not be null");
        return new SecretValue(value.getBytes(StandardCharsets.UTF_8));
    }

    public static SecretValue of(byte[] value) {
        Objects.requireNonNull(value, "secret value must not be null");
        return new SecretValue(value.clone());
    }

    /** The raw bytes, as a copy — the caller cannot reach into this value's state. */
    public byte[] bytes() {
        return bytes.clone();
    }

    public String asString() {
        return new String(bytes, StandardCharsets.UTF_8);
    }

    public int length() {
        return bytes.length;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof SecretValue that && MessageDigest.isEqual(this.bytes, that.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    /** Masked on purpose: never print a secret. */
    @Override
    public String toString() {
        return MASK;
    }

    @JsonValue
    String json() {
        return "***";
    }
}
