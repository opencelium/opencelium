package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.List;

public class LogProcessingException extends RuntimeException {
    public LogProcessingException(String message) {
        super(message);
    }

    public static LogProcessingException unsupportedLine(String line, LogEntryType entryType) {
        return new LogProcessingException("%s parser doesn't support this log : %s".formatted(entryType.getTitle(), line));
    }

    public static LogProcessingException missingRequiredProperty(String key, String line) {
        return new LogProcessingException("Missing required property : %s. Log : %s".formatted(key, line));
    }

    public static LogProcessingException noExecutionInitialized(String executionId) {
        return new LogProcessingException("No execution initialized with ID : %s".formatted(executionId));
    }

    public static LogProcessingException noTrackerInitialized(LogEntryType entryType, String indexPath) {
        return new LogProcessingException("%s[indexPath=%s] isn't initialized".formatted(LogTrackerType.fromLogEntry(entryType).name(), indexPath));
    }

    public static LogProcessingException wrongIndexPathSequenceFound(List<String> paths) {
        return new LogProcessingException("Wrong indexPathSequenceFound : %s".formatted(paths.toString()));
    }

    public static LogProcessingException invalidValueForProperty(String key, Object value) {
        return new LogProcessingException("Invalid value for property : %s=%s".formatted(key, value));
    }

    public static LogProcessingException noTrackerInitialized(String line) {
        return new LogProcessingException("No tracker initialized with ID : %s".formatted(line));
    }

    public static LogProcessingException unsupportedLineFound(String line) {
        return new LogProcessingException("Unsupported line found : %s".formatted(line));
    }

    public static RuntimeException missingRequiredLogPart(LogEntryType missing, LogEntryType ending) {
        return new LogProcessingException("%s part is missing before ending : %s".formatted(missing.getTitle(), ending.getTitle()));
    }
}
