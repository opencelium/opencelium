package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.List;

public class LogProcessingException extends RuntimeException {
    public LogProcessingException(String message) {
        super(message);
    }

    public static LogProcessingException unsupportedLine(String line, LogEntryType entryType) {
        return new LogProcessingException(entryType.getTitle() + " parser doesn't support this log : " + line);
    }

    public static LogProcessingException invalidLoopIndex(String value) {
        return new LogProcessingException("Invalid loopIndex : %s".formatted(value));
    }

    public static LogProcessingException cantReadData(String data) {
        return new LogProcessingException("Can't read data : " + data);
    }

    public static LogProcessingException missingRequiredProperty(String key, String line) {
        return new LogProcessingException("Missing required property : " + key + ". Log : " + line);
    }

    public static LogProcessingException noExecutionInitialized(String executionId) {
        return new LogProcessingException("No execution initialized with : " + executionId);
    }

    public static LogProcessingException noTrackerInitialized(LogEntryType entryType, String indexPath ) {
        return new LogProcessingException("%s[indexPath=%s] isn't initialized".formatted(LogTrackerType.fromLogEntry(entryType).name(), indexPath));
    }

    public static LogProcessingException wrongIndexPathSequenceFound(List<String> paths) {
        return new LogProcessingException("Wrong indexPathSequenceFound : %s".formatted(paths.toString()));
    }
}
