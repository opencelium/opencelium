package com.becon.opencelium.backend.execution.log_managing.commons;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;

import javax.xml.parsers.DocumentBuilderFactory;
import java.util.Map;

/**
 * Utility class providing common parsing methods for log property values.
 */
public class PropertyParsers {

    private PropertyParsers() {}

    private static final ObjectMapper mapper = new ObjectMapper();
    public static final DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

    public static Integer parseInteger(String key, String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw LogProcessingException.invalidValueForProperty(key, value);
        }
    }

    public static Boolean parseBoolean(String key, String value) {
        if (("true".equals(value) || "false".equals(value))) {
            return Boolean.parseBoolean(value);
        }
        throw LogProcessingException.invalidValueForProperty(key, value);
    }

    public static Object parseData(String data) {
        if (StringUtils.isBlank(data)) {
            return data;
        }

        // JSON
        if (data.charAt(0) == '{' && data.charAt(data.length() - 1) == '}') {
            try {
                return mapper.readValue(data, Map.class);
            } catch (JsonProcessingException e) {
                return data;
            }
        }

        // TODO: handle xml format
        return data;
    }
}