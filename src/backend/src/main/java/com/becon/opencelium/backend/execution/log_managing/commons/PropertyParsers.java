package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class PropertyParsers {

    public static Integer parseInteger(String key, String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw LogProcessingException.invalidValueForProperty(key, value);
        }
    }

    public static Map<String, Object> applyParsing(Set<PropDescriptor> descriptors, Map<String, String> properties) {
        return properties.entrySet().stream()
                .map(x -> descriptors.stream()
                        .filter(y -> y.key().equals(x.getKey()))
                        .findFirst()
                        .map(z -> Map.entry(x.getKey(), z.getValueParser().apply(x.getValue())))
                        .orElseGet(() -> Map.entry(x.getKey(), x.getValue()))
                ).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public static Boolean parseBoolean(String key, String value) {
        if (("true".equals(value) || "false".equals(value))) {
            return Boolean.parseBoolean(value);
        }
        throw LogProcessingException.invalidValueForProperty(key, value);
    }

    public static Object parseData(String data) {
        // TODO: implement
        return data;
    }
}
