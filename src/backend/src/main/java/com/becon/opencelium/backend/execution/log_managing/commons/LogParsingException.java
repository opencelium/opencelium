package com.becon.opencelium.backend.execution.log_managing.commons;

public class LogParsingException extends RuntimeException {
    public LogParsingException(String message) {
        super(message);
    }

    public static LogParsingException unsupportedLine(String line, LogEntryType entryType) {
        return new LogParsingException(entryType.getTitle() + " parser doesn't support this log : " + line);
    }

    public static LogParsingException invalidLoopIndex(String value) {
        return new LogParsingException("Invalid loopIndex : " + value);
    }

    public static LogParsingException cantReadData(String data) {
        return new LogParsingException("Can't read data : " + data);
    }

    public static LogParsingException missingRequiredProperty(String key, String line) {
        return new LogParsingException("Missing required property : " + key + " : " + line);
    }
}
