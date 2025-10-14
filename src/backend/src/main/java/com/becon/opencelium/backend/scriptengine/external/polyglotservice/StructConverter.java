package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.google.protobuf.ListValue;
import com.google.protobuf.Struct;
import com.google.protobuf.Value;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Utility for converting between Map<String, Object> and google.protobuf.Struct.
 *
 * Supports nested structures and lists, and handles null, boolean, numeric,
 * string, map, and list values correctly.
 */
public final class StructConverter {

    private StructConverter() {
        // utility class — no instantiation
    }

    /** Converts a Map<String, Object> into a google.protobuf.Struct */
    public static Struct toStruct(Map<String, Object> map) {
        if (map == null) {
            return Struct.getDefaultInstance();
        }

        Struct.Builder builder = Struct.newBuilder();
        map.forEach((key, value) -> builder.putFields(key, toValue(value)));
        return builder.build();
    }

    /** Converts a google.protobuf.Struct into a Map<String, Object> */
    public static Map<String, Object> fromStruct(Struct struct) {
        if (struct == null) {
            return Collections.emptyMap();
        }

        return struct.getFieldsMap().entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> fromValue(e.getValue())));
    }

    public static Value toValue(Object obj) {
        if (obj == null) {
            return Value.newBuilder().setNullValueValue(0).build();
        }

        if (obj instanceof String s) {
            return Value.newBuilder().setStringValue(s).build();
        }

        if (obj instanceof Number n) {
            return Value.newBuilder().setNumberValue(n.doubleValue()).build();
        }

        if (obj instanceof Boolean b) {
            return Value.newBuilder().setBoolValue(b).build();
        }

        if (obj instanceof Map<?, ?> m) {
            Struct nested = toStruct((Map<String, Object>) m);
            return Value.newBuilder().setStructValue(nested).build();
        }

        if (obj instanceof Iterable<?> iterable) {
            ListValue.Builder list = ListValue.newBuilder();
            for (Object item : iterable) {
                list.addValues(toValue(item));
            }
            return Value.newBuilder().setListValue(list).build();
        }

        return Value.newBuilder().setStringValue(obj.toString()).build();
    }


    public static Object fromValue(Value value) {
        if (value == null) return null;

        return switch (value.getKindCase()) {
            case NULL_VALUE -> null;
            case NUMBER_VALUE -> value.getNumberValue();
            case STRING_VALUE -> value.getStringValue();
            case BOOL_VALUE -> value.getBoolValue();
            case STRUCT_VALUE -> fromStruct(value.getStructValue());
            case LIST_VALUE -> value.getListValue().getValuesList().stream()
                    .map(StructConverter::fromValue)
                    .toList();
            case KIND_NOT_SET -> null;
        };
    }
}
