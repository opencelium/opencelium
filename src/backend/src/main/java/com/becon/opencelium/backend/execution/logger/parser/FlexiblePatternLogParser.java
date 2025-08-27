package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.service.LogStorageService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * FlexiblePatternLogParser is a log line parser that extracts key-value data
 * from semi-structured log lines.
 *
 * It is designed to work with logs where the timestamp and log level can appear
 * in different positions and may be ANSI-colored.
 */
@Component
public class FlexiblePatternLogParser implements LogLineParser {
    private final LogStorageService logStorageService;

    // Pattern for timestamps in format: dd-MM-yyyy HH:mm:ss.SSS
    private static final Pattern TIMESTAMP_PATTERN = Pattern.compile("\\b\\d{2}-\\d{2}-\\d{4} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}\\b");

    // Pattern for log levels with optional ANSI coloring: INFO, DEBUG, WARN, etc.
    private static final Pattern LOG_LEVEL_PATTERN = Pattern.compile("(?:(?:\\x1B\\[[\\d;]+m)?(INFO|DEBUG|ERROR|WARN|TRACE)(?:\\x1B\\[[\\d;]+m)?)");

    // Pattern for key-value pairs:
    // Matches key=value with value being quoted, JSON-like object, or simple word
    private static final Pattern KV_PATTERN = Pattern.compile(
//            "(\\w+)=((?:\"[^\"]*\")|(?:\\{[^}]*\\})|(?:\\S+))"
            "(\\w+)=((\"[^\"]*\"|\\{[^}]*\\}|[^\\s]+(?:\\s(?!\\w+=)[^\\s]+)*))" //without stacktrace
//            "(\\\\w+)=((?:\\\"[^\\\"]*\\\"|\\\\{[^}]*\\\\}|[^\\\\s=]+(?:\\\\s(?!\\\\w+=)[^\\\\s=]+)*)(?:\\\\R.*)*)" // - with stacktrace
//            "(\\w+)=((?:\"[^\"]*\"|\\{[^}]*\\}|[^\\s=]+(?:\\s(?!\\w+=)[^\\s=]+)*)+)", Pattern.DOTALL
    );

    // Pattern to validate log line:
    private static final Pattern HAS_PHASE_SEGMENT = Pattern.compile(
            "(?m)^(?:(?!\").)*?\\b(?:segment|phase)=[^\\s]+.*$"
    );

    public FlexiblePatternLogParser(LogStorageService logStorageService) {
        this.logStorageService = logStorageService;
    }

    /**
     * Checks if this parser supports the given line format.
     * It considers a line supported if it has at least a timestamp,
     * a log level, or any key-value pair.
     */
    @Override
    public boolean supports(String line) {
        boolean hasTimestamp = TIMESTAMP_PATTERN.matcher(line).find();
        boolean hasLogLevel = LOG_LEVEL_PATTERN.matcher(line).find();
        boolean hasPhaseSegment = HAS_PHASE_SEGMENT.matcher(line).find();

        return hasTimestamp || hasLogLevel || hasPhaseSegment;
    }

    /**
     * Parses a supported line into a map of keys and values.
     * It extracts:
     * - timestamp (if present)
     * - log_level (if present)
     * - msg: remaining log message text
     * - All key-value pairs from msg
     */
    @Override
    public Map<LogLineKey, String> parse(String line) {
        Map<LogLineKey, String> result = new LinkedHashMap<>();

        // 1. Extract timestamp and remove it from line
        Matcher timestampMatcher = TIMESTAMP_PATTERN.matcher(line);
        if (timestampMatcher.find()) {
            result.put(LogLineKey.TIMESTAMP, timestampMatcher.group());
            line = removeAt(line, timestampMatcher.start(), timestampMatcher.end());
        }

        // 2. Extract log level and remove it from line
        Matcher levelMatcher = LOG_LEVEL_PATTERN.matcher(line);
        if (levelMatcher.find()) {
            result.put(LogLineKey.LOG_LEVEL, levelMatcher.group(1));
            line = removeAt(line, levelMatcher.start(), levelMatcher.end());
        }

        // 3. Remaining content is the raw message
        String msg = line.trim();
        result.put(LogLineKey.MESSAGE, line);

        // 4. Parse all key=value pairs from the message content
        Matcher kvMatcher = KV_PATTERN.matcher(msg);
        while (kvMatcher.find()) {
            String key = kvMatcher.group(1);
            String value = kvMatcher.group(2);
            // Strip surrounding quotes, if any
            if (value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length() - 1);
            }
            if (LogLineKey.from(key).isPresent()) {
                result.put(LogLineKey.from(key).get(), value);
            }

        }

        return result;
    }

    @Override
    public List<String> readLines(String executionId, long startOffset, long endOffset) {
        List<String> result = new ArrayList<>();

        List<String> block = logStorageService.readBlock(executionId, startOffset, endOffset);

        int left = 0, right = 0;
        StringBuilder current;

        while (right < block.size()) {
            current = new StringBuilder(block.get(left)); // at this line always left = right, store current line
            right++; // move right pointer to check if it is continuation
            while(right < block.size() && !supports(block.get(right))) {
                current.append("\n").append(block.get(right));
                right++;
            }

            result.add(current.toString()); // add generated line to result
            left = right;
        }

        return result;
    }


    /**
     * Removes a portion of a string from start to end index (exclusive),
     * trimming and spacing the result to preserve readability.
     *
     * @param s the original string
     * @param start the start index of the segment to remove
     * @param end the end index of the segment to remove
     * @return the trimmed string with the segment removed
     */
    private static String removeAt(String s, int start, int end) {
        return s.substring(0, start).trim() + " " + s.substring(end).trim();
    }
}
