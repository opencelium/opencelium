package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.constant.LogConstant;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    /** What takes the place of a hidden text in a line. */
    public static final String HIDDEN_MASK = "****";

    private final T logEntity;
    private final boolean enabled; // debug is ON || SUPPORT_FILE is enabled
    private final Logger logger;
    // longest first, so a text that holds another one is hidden as a whole
    private volatile List<String> hidden = List.of();


    public OcLogger(boolean enabled, T logEntity, long connectionId, String timestamp, long executionId) {
        this.enabled = enabled;
        this.logEntity = logEntity;

        Path filepath = LogFileUtility.buildUncategorizedLogFilePath(timestamp, connectionId, executionId);
        String loggerId = String.valueOf(executionId);
        ch.qos.logback.classic.Logger classicLogger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(loggerId);

        if (enabled) {
            LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();

            PatternLayoutEncoder encoder = new PatternLayoutEncoder();
            encoder.setContext(context);
            encoder.setPattern(LogConstant.LOG_LINE_PATTERN);
            encoder.setCharset(StandardCharsets.UTF_8);
            encoder.start();

            FileAppender<ILoggingEvent> fileAppender = new OffsetTrackingAppender(executionId);
            fileAppender.setName("Appender-" + loggerId);
            fileAppender.setContext(context);
            fileAppender.setFile(filepath.toString());
            fileAppender.setEncoder(encoder);
            fileAppender.start();

            classicLogger.addAppender(fileAppender);
            classicLogger.setAdditive(false);
        }

        this.logger = classicLogger;
    }

    public void clear() {
        if (enabled && logger instanceof ch.qos.logback.classic.Logger classicLogger) {
            classicLogger.iteratorForAppenders().forEachRemaining(appender -> {
                if (appender instanceof FileAppender) {
                    appender.stop();
                }
            });

            classicLogger.detachAndStopAllAppenders();
        }
    }

    public T getLogEntity() {
        return logEntity;
    }

    /**
     * Hides these texts in every line written from now on, an exception included, each replaced
     * with {@link #HIDDEN_MASK}: the values of the secret global variables a run reads. Replaces
     * the texts given before.
     */
    public void hide(Collection<String> texts) {
        hidden = longestFirst(texts);
    }

    /**
     * Returns {@code text} with each of {@code texts} replaced by {@link #HIDDEN_MASK}, the way a
     * line of this logger is, for what reports a run elsewhere.
     */
    public static String hideIn(String text, Collection<String> texts) {
        return text == null ? null : replaceAll(text, longestFirst(texts));
    }

    public void logAndSend(String message) {
        logAndSend(logger::info, message);
    }

    public void logAndSend(Exception e) {
        if (!enabled) {
            return;
        }

        String stackTrace = getStackTraceAsString(e);
        String logMessage = "segment=EXCEPTION data=" + stackTrace;

        logAndSend(logger::info, logMessage);
    }


    private void logAndSend(Consumer<String> writer, String message) {
        if (!enabled) {
            return;
        }

        writer.accept(replaceAll(message, hidden));
    }

    private static List<String> longestFirst(Collection<String> texts) {
        return texts.stream()
                .filter(text -> text != null && !text.isEmpty())
                .distinct()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList();
    }

    private static String replaceAll(String message, List<String> texts) {
        String result = message;
        for (String text : texts) {
            result = result.replace(text, HIDDEN_MASK);
        }

        return result;
    }

    private String getStackTraceAsString(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}
