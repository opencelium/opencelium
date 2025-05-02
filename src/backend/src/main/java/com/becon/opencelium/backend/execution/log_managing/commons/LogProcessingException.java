package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.List;

public class LogProcessingException extends RuntimeException {
    public LogProcessingException(String message) {
        super(message);
    }

    public static LogProcessingException unsupportedLine(String line, LogEntryType entryType) {
        return new LogProcessingException("%s parser doesn't support this log : %s".formatted(entryType.getTitle(), line));
    }

    public static LogProcessingException invalidLoopIndex(String value) {
        return new LogProcessingException("Invalid loopIndex : %s".formatted(value));
    }

    public static LogProcessingException cantReadData(String data) {
        return new LogProcessingException("Can't read data : %s".formatted(data));
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

    public static LogProcessingException invalidLoopCount(String loopCount) {
        return new LogProcessingException("Invalid loopCount : %s".formatted(loopCount));
    }
}
