package com.becon.opencelium.backend.execution.globalvariable;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Writes the global variable snapshot of a run as lines of its execution log, one
 * {@code GLOBAL_SNAPSHOT} segment line per variable, so the log tells which version of each
 * variable the run read and, within limits, its value.
 *
 * <p>A line reads {@code segment=GLOBAL_SNAPSHOT name=<name> version=<version> data=<value>},
 * the value as compact JSON. {@code data} comes last, because the log parser takes the rest of
 * the line as its value.
 *
 * <ul>
 *   <li>The value of a secret is never written, nor anything that tells its size: its line holds
 *       {@link #SECRET_MASK} as a JSON string, whether or not the secret could be decrypted. The
 *       value is not even read, so a secret that cannot be decrypted does not fail the run.
 *   <li>The value of any other variable is written whole, or not at all: when it has more than
 *       {@link #MAX_VALUE_BYTES} bytes, or when the values written before it already add up to
 *       {@link #MAX_RUN_VALUE_BYTES} bytes, its line holds {@code size=<bytes>} instead of
 *       {@code data}. A value is never cut, so what the log holds is always valid JSON.
 * </ul>
 *
 * <p>Variables come in the order of the snapshot, by name, so the same snapshot always logs the
 * same values. Every line goes through the logger, which also hides the texts of the secrets
 * wherever else they appear, for instance inside the value of another variable.
 */
public final class GlobalSnapshotLogLines {

    /** What the log writes in place of the value of a secret, as a JSON string. */
    public static final String SECRET_MASK = "••••";

    /** The most bytes of compact JSON the log writes for the value of one variable. */
    public static final int MAX_VALUE_BYTES = 4 * 1024;

    /** The most bytes of compact JSON the log writes for the values of one run, all together. */
    public static final int MAX_RUN_VALUE_BYTES = 32 * 1024;

    private static final String LINE_HEAD = "segment=GLOBAL_SNAPSHOT name=%s version=%d";
    private static final String MASKED_DATA = " data=\"" + SECRET_MASK + "\"";

    private GlobalSnapshotLogLines() {
    }

    /**
     * Returns the lines that log the snapshot, one per variable; none when the snapshot is empty.
     */
    public static List<String> of(GlobalVariableSnapshot snapshot) {
        List<String> lines = new ArrayList<>(snapshot.entries().size());
        int budget = MAX_RUN_VALUE_BYTES;
        for (GlobalVariableSnapshot.Entry entry : snapshot.entries()) {
            String head = LINE_HEAD.formatted(entry.name(), entry.version());
            if (entry.secret()) {
                lines.add(head + MASKED_DATA);
                continue;
            }

            String json = entry.value().toString();
            int bytes = json.getBytes(StandardCharsets.UTF_8).length;
            if (bytes <= MAX_VALUE_BYTES && bytes <= budget) {
                lines.add(head + " data=" + json);
                budget -= bytes;
            } else {
                lines.add(head + " size=" + bytes);
            }
        }

        return List.copyOf(lines);
    }
}
