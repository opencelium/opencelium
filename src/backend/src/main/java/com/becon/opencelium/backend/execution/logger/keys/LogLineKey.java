package com.becon.opencelium.backend.execution.logger.keys;

import java.util.Arrays;
import java.util.Optional;

/**
 * Utility class for defining and validating keys used in structured log lines.
 * <p>
 * This class groups keys by their logical log line context (e.g., OPERATION, LOOP, IF),
 * ensuring consistent usage and enabling validation against known allowed keys per category.
 * </p>
 */
public enum LogLineKey {

    /** Common property keys used across phases */
    PHASE("phase"),
    SEGMENT("segment"),
    EXECUTION_ID("id"),
    CONNECTION_ID("connectionId"),
    FLOWCHART_ID("flowId"),
    CONNECTOR_ID("connectorId"),
    CONNECTOR_NAME("connectorName"),
    INDEX_PATH("indexPath"), // Path in the log flow hierarchy (e.g., 1_0, 1_1)

    /** Optional properties of a log line that do not have a key and are created during the parsing process. */
    TIMESTAMP("timestamp"),
    LOG_LEVEL("logLevel"),
    MESSAGE("msg"),

    /** Shared keys reused across multiple categories */
    DATA("data"), // Generic data field, often used for payload or headers
    LOOP_ITERATOR("loopIterator"), // Iterator variable used in loop structures (e.g i; i,j; i,j,k)
    LOOP_INDEX("loopIndex"), // Index of the current iteration in a loop (e.g 1; 1,0; 1,0,3)

    /**
     * Key definitions for OPERATION phase log lines.
     */
    NAME("name"),
    URL("url"),
    HTTP_METHOD("httpMethod"),
    HTTP_STATUS("status"),
    DURATION("duration"),

    /**
     * Key definitions for IF phase log lines.
     */
    REF("ref"), // Reference identifier (e.g., #ffffff.request.body.$.path.to.field)
    RESULT("result"), // Result of the IF evaluation (true/false)
    EXPRESSION("expression"), // Boolean expression evaluated by the IF condition; Loop expression (e.g., iterable or range)

    /**
     * Key definitions for LOOP phase log lines.
     */
    ITERATOR("iterator"),

    EXCEPTION("exception");

    private final String srcName;

    LogLineKey(String srcName) {
        this.srcName = srcName;
    }

    public String getSrcName() {
        return srcName;
    }

    public static Optional<LogLineKey> from(String key) {
        return Arrays.stream(values())
                .filter(k -> k.srcName.equals(key))
                .findFirst();
    }

    public static boolean contains(String key) {
        return Arrays.stream(values())
                .anyMatch(k -> k.srcName.equals(key));
    }
}
