package com.becon.opencelium.backend.versionmanager.base;

/**
 * Helpers for the hierarchical, underscore-separated flow {@code index}
 * (e.g. {@code "2_0_1"}) shared by the v5.0 connection/template updaters.
 *
 * <p>The first component is the root-level position; every further component is a
 * position inside a parent operator's body. When two legacy connectors are merged
 * under a single {@code fromConnector}, the to-side root indexes must continue the
 * from-side root indexes — which is what {@link #rootOffset} and {@link #shiftRoot} do.
 */
public final class FlowIndexUtils {

    private FlowIndexUtils() {
    }

    /**
     * Number of root-level slots occupied by the given indexes, i.e. {@code max(root component) + 1}.
     * Returns 0 when there are no indexes, which leaves to-side indexes untouched via {@link #shiftRoot}.
     */
    public static int rootOffset(Iterable<String> indexes) {
        int max = -1;
        for (String index : indexes) {
            if (index != null && !index.isEmpty()) {
                max = Math.max(max, rootOf(index));
            }
        }
        return max + 1;
    }

    /** Parses the first (root-level) numeric component of a hierarchical {@code "a_b_c"} index. */
    public static int rootOf(String index) {
        int us = index.indexOf('_');
        return Integer.parseInt(us < 0 ? index : index.substring(0, us));
    }

    /**
     * Shifts only the root (first) component of a hierarchical index by {@code offset},
     * preserving every nested component. {@code "2_0"} with offset 3 becomes {@code "5_0"}.
     * A zero offset (or a blank index) returns the index unchanged.
     */
    public static String shiftRoot(String index, int offset) {
        if (offset == 0 || index == null || index.isEmpty()) return index;
        int us = index.indexOf('_');
        String head = (us < 0) ? index : index.substring(0, us);
        String tail = (us < 0) ? "" : index.substring(us); // keeps the leading '_'
        return (Integer.parseInt(head) + offset) + tail;
    }
}
