package com.becon.opencelium.backend.constant;

import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

public interface LogConstant {
    String LOG_LOCATION = "src/main/resources/logs";
    String FILE_EXTENSION = "log";
    DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm");
    String NAME_PARTS_SEPARATOR = "_";
    String LOG_FILE_NAME_RGX = ".+_.+_.+_.+_\\d+\\.log";
    String LOG_LINE_PATTERN = "%d{dd-MM-yyyy HH:mm:ss.SSS} - %msg%n";

    // pattern to match log file names and extract executionId:
    // yyyy-MM-dd_HH-mm_<tag>_(u|f|s)_<executionId>.log
    Pattern FILE_NAME_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}_.+_(u|f|s)_(.+)\\.log");

    // execution result types
    String SUCCESS = "s";
    String FAIL = "f";
    String UNCATEGORIZED = "u";
}
