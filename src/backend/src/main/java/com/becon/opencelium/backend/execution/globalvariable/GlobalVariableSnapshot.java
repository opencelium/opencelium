package com.becon.opencelium.backend.execution.globalvariable;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;

/**
 * The global variables a run reads, as they were when the run started.
 *
 * <p>A run takes its snapshot once, before its first step, and never reads the store again: a
 * change saved while the run is going reaches the next run, not this one. The snapshot holds the
 * variables in the scope of the workflow only, so a reference to any other variable does not
 * resolve.
 */
public final class GlobalVariableSnapshot {

    private static final GlobalVariableSnapshot EMPTY = new GlobalVariableSnapshot(Map.of());

    /**
     * One variable as the run sees it.
     *
     * @param name      name of the variable
     * @param version   version of the variable when the snapshot was taken
     * @param value     the value as a JSON tree; treat it as read-only
     * @param openToAll whether the scope of the variable is every workflow, which is what a
     *                  connector needs: it is shared by workflows of any category
     */
    public record Entry(String name, long version, JsonNode value, boolean openToAll) {

        public Entry {
            Objects.requireNonNull(name, "name");
            Objects.requireNonNull(value, "value");
        }

        /** Creates the entry of a variable that is open to all workflows. */
        public Entry(String name, long version, JsonNode value) {
            this(name, version, value, true);
        }
    }

    private final Map<String, Entry> entries;

    private GlobalVariableSnapshot(Map<String, Entry> entries) {
        this.entries = entries;
    }

    /** Returns the snapshot of a run that reads no global variable. */
    public static GlobalVariableSnapshot empty() {
        return EMPTY;
    }

    /**
     * Creates a snapshot of the given variables.
     *
     * @throws IllegalArgumentException if two entries have the same name
     */
    public static GlobalVariableSnapshot of(Collection<Entry> entries) {
        Map<String, Entry> byName = new TreeMap<>();
        for (Entry entry : entries) {
            if (byName.put(entry.name(), entry) != null) {
                throw new IllegalArgumentException("Global variable '" + entry.name() + "' is in the snapshot twice");
            }
        }

        return byName.isEmpty() ? EMPTY : new GlobalVariableSnapshot(Collections.unmodifiableMap(byName));
    }

    /** Finds a variable by its exact name. */
    public Optional<Entry> find(String name) {
        return Optional.ofNullable(entries.get(name));
    }

    /** Returns every variable of the snapshot, ordered by name. */
    public Collection<Entry> entries() {
        return entries.values();
    }

    public boolean isEmpty() {
        return entries.isEmpty();
    }
}
