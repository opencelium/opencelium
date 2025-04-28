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

    public static Map<String, String> extractKeyValuePairs(String line, Set<PropDescriptor> props) {
        //TODO: enhance parsing object values
        Map<String, String> result = new HashMap<>();

        for (PropDescriptor prop : props) {
            String regex = prop.key() + "=((\"[^\"]*\")|(\\{.*?})|[^\\s\"]+)";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(line);

            if (matcher.find()) {
                String rawValue = matcher.group(1);
                String value = rawValue.startsWith("\"") && rawValue.endsWith("\"")
                        ? rawValue.substring(1, rawValue.length() - 1)
                        : rawValue;

                result.put(prop.key(), value);
            } else if (prop.required()) {
                throw LogParsingException.missingRequiredProperty(prop.key(), line);
            }
        }

        return result;
    }


    public static LogEntryType extractEntryType(String line) {
        Pattern pattern = Pattern.compile("(scope|section)=(\\S+)");
        Matcher matcher = pattern.matcher(line);
        if (matcher.find()) {
            return LogEntryType.getByTitleOrElseNull(matcher.group(2));
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseMap(String data) {
        try {
            return (Map<String, Object>) mapper.readValue(data, Map.class);
        } catch (JsonProcessingException e) {
            throw LogParsingException.cantReadData(data);
        }
    }
}
