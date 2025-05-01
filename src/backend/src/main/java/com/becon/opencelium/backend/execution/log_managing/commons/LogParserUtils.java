package com.becon.opencelium.backend.execution.log_managing.commons;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LogParserUtils {

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final Pattern SCOPE_PATTERN = Pattern.compile("scope=(\\S+)"); // scope value must not contain spaces
    private static final Pattern SECTION_PATTERN = Pattern.compile("section=(\\S+)"); // section value must not contain spaces

    public static Map<String, String> extractKeyValuePairs(String line, Set<PropDescriptor> props) {
        Map<String, String> result = new HashMap<>();

        for (PropDescriptor prop : props) {
            String regex = prop.key() + "=((\"[^\"]*\")|[^\\s\"]+)";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(line);

            if (matcher.find()) {
                String rawValue = matcher.group(1);
                String value = rawValue.startsWith("\"") && rawValue.endsWith("\"")
                        ? rawValue.substring(1, rawValue.length() - 1)
                        : rawValue;

                result.put(prop.key(), value);
            } else if (prop.required()) {
                throw LogProcessingException.missingRequiredProperty(prop.key(), line);
            }
        }

        return result;
    }


    public static LogEntryType extractEntryType(String line) {
        Matcher matcher = SECTION_PATTERN.matcher(line);
        if (matcher.find()) {
            return LogEntryType.getByTitleOrElseNull(matcher.group(1));
        }
        matcher = SCOPE_PATTERN.matcher(line);
        if (matcher.find()) {
            return LogEntryType.getByTitleOrElseNull(matcher.group(1));
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseMap(String data) {
        try {
            return (Map<String, Object>) mapper.readValue(data, Map.class);
        } catch (JsonProcessingException e) {
            throw LogProcessingException.cantReadData(data);
        }
    }
}
