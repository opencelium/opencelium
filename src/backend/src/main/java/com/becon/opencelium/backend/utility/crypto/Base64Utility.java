package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.utility.InstantDeserializer;
import com.becon.opencelium.backend.utility.InstantSerializer;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.Instant;
import java.util.Base64;

public class Base64Utility {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        SimpleModule module = new SimpleModule();
        module.addSerializer(Instant.class, new InstantSerializer());
        module.addDeserializer(Instant.class, new InstantDeserializer());
        objectMapper.registerModules(module, new JavaTimeModule());
        objectMapper.configure(DeserializationFeature.FAIL_ON_IGNORED_PROPERTIES, false);
    }
    private Base64Utility() {
    }

    public static String encode(String input) {
        return Base64.getEncoder().encodeToString(input.getBytes());
    }

    public static String decode(String input) {
        byte[] decodedBytes = Base64.getDecoder().decode(input);
        return new String(decodedBytes);
    }

    public static <T> String encode(T input) {
        try {
            String jsonString = objectMapper.writeValueAsString(input);
            return encode(jsonString);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static <T> T decode(String input, Class<T> clazz) {
        try {
            String jsonString = decode(input);
            return objectMapper.readValue(jsonString, clazz);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
