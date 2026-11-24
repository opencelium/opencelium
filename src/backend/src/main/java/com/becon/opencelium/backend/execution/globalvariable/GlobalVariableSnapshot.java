package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import org.springframework.web.util.UriUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;

/**
 * The global variables a run reads, as they were when the run started.
 *
 * <p>A run takes its snapshot once, before its first step, and reads constants from it only: a
 * change saved while the run is going reaches the next run, not this one. A mutable variable is
 * read live from the store at each read instead, and its entry here is the run's copy of the
 * value it last saw. A script variable is held as its definition, which an enhancement that
 * imports it runs; it has no value to read. The snapshot holds the variables in the scope of the
 * workflow only, so a reference to any other variable does not resolve.
 *
 * <p>The value of a secret is held decrypted, in memory only. Its entry says it is a secret, so
 * what logs or shows a request can hide it with {@link #secretTexts()}.
 */
public final class GlobalVariableSnapshot {

    /**
     * Texts shorter than this are not hidden: hiding {@code 1} or {@code ab} would garble every
     * line that holds them, and so little hides next to nothing.
     */
    public static final int MIN_HIDDEN_LENGTH = 4;

    private static final GlobalVariableSnapshot EMPTY = new GlobalVariableSnapshot(Map.of(), Map.of());
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String MASK = "****";

    /**
     * One variable as the run sees it.
     *
     * @param name             name of the variable
     * @param version          version of the variable when the snapshot was taken
     * @param value            the value as a JSON tree; treat it as read-only. The definition
     *                         of a script, as {@link GlobalScript#toJson} writes it
     * @param openToAll        whether the scope of the variable is every workflow, which is what
     *                         a connector needs: it is shared by workflows of any category
     * @param secret           whether the variable is a secret, whose value logs must hide
     * @param kind             kind of the variable: a mutable one is read live rather than from
     *                         this snapshot, a script is called rather than read
     * @param unreadableReason why the value of a secret could not be decrypted, {@code null}
     *                         when it could; never holds the stored text
     */
    public record Entry(String name, long version, JsonNode value, boolean openToAll, boolean secret,
            GlobalVariableKind kind, String unreadableReason) {

        public Entry {
            Objects.requireNonNull(name, "name");
            Objects.requireNonNull(value, "value");
            Objects.requireNonNull(kind, "kind");
        }

        /** Creates the entry of a constant that is open to all workflows and is not a secret. */
        public Entry(String name, long version, JsonNode value) {
            this(name, version, value, true);
        }

        /** Creates the entry of a constant that is not a secret. */
        public Entry(String name, long version, JsonNode value, boolean openToAll) {
            this(name, version, value, openToAll, false, GlobalVariableKind.CONSTANT, null);
        }

        /**
         * Creates the entry of a mutable variable, with the current value it had when the snapshot
         * was taken. A mutable variable is never a secret.
         */
        public static Entry ofMutable(String name, long version, JsonNode value, boolean openToAll) {
            return new Entry(name, version, value, openToAll, false, GlobalVariableKind.MUTABLE, null);
        }

        /**
         * Creates the entry of a script variable, with its definition as {@link GlobalScript#toJson}
         * writes it. A script is never a secret.
         */
        public static Entry ofScript(String name, long version, JsonNode definition, boolean openToAll) {
            return new Entry(name, version, definition, openToAll, false, GlobalVariableKind.SCRIPT, null);
        }

        /** Creates the entry of a secret, with its decrypted value. */
        public static Entry ofSecret(String name, long version, JsonNode value, boolean openToAll) {
            return new Entry(name, version, value, openToAll, true, GlobalVariableKind.CONSTANT, null);
        }

        /**
         * Creates the entry of a secret whose value could not be decrypted. Only what reads the
         * value fails, so a run that does not use the secret is not stopped by it.
         *
         * @param reason why it could not be decrypted, for the error
         */
        public static Entry ofUnreadableSecret(String name, long version, boolean openToAll, String reason) {
            return new Entry(name, version, MissingNode.getInstance(), openToAll, true, GlobalVariableKind.CONSTANT,
                    Objects.requireNonNull(reason, "reason"));
        }

        /** Tells whether the variable is mutable, whose value a run reads live. */
        public boolean mutable() {
            return kind == GlobalVariableKind.MUTABLE;
        }

        /** Tells whether the variable is a script, which an enhancement imports and calls. */
        public boolean script() {
            return kind == GlobalVariableKind.SCRIPT;
        }

        /**
         * Returns the value as a JSON tree; treat it as read-only.
         *
         * @throws WrongDecryptException if this is a secret whose value could not be decrypted
         */
        @Override
        public JsonNode value() {
            if (unreadableReason != null) {
                throw new WrongDecryptException("The value of secret global variable '%s' cannot be read: %s"
                        .formatted(name, unreadableReason));
            }

            return value;
        }

        /** Tells whether {@link #value()} returns a value rather than failing. */
        public boolean isReadable() {
            return unreadableReason == null;
        }

        // the value of a secret stays out of whatever prints an entry
        @Override
        public String toString() {
            return "Entry[name=%s, version=%d, value=%s, openToAll=%b, secret=%b, kind=%s]"
                    .formatted(name, version, secret ? MASK : value, openToAll, secret, kind);
        }
    }

    private final Map<String, Entry> entries;
    // the parsed definitions of the script entries that came with them, by name
    private final Map<String, GlobalScript> scripts;

    private GlobalVariableSnapshot(Map<String, Entry> entries, Map<String, GlobalScript> scripts) {
        this.entries = entries;
        this.scripts = scripts;
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
        return of(entries, Map.of());
    }

    /**
     * Creates a snapshot of the given variables, with the parsed definitions of its scripts, so
     * an enhancement that imports a script does not parse it again at each call.
     *
     * @param scripts the definition of each script entry by its name, each the one its entry
     *                holds as JSON; a script left out is parsed from its entry when it is called
     * @throws IllegalArgumentException if two entries have the same name, or a definition is
     *                                  given for a name that is no script entry
     */
    public static GlobalVariableSnapshot of(Collection<Entry> entries, Map<String, GlobalScript> scripts) {
        Map<String, Entry> byName = new TreeMap<>();
        for (Entry entry : entries) {
            if (byName.put(entry.name(), entry) != null) {
                throw new IllegalArgumentException("Global variable '" + entry.name() + "' is in the snapshot twice");
            }
        }
        for (String name : scripts.keySet()) {
            Entry entry = byName.get(name);
            if (entry == null || !entry.script()) {
                throw new IllegalArgumentException("Global variable '" + name + "' is no script of the snapshot");
            }
        }

        return byName.isEmpty()
                ? EMPTY
                : new GlobalVariableSnapshot(Collections.unmodifiableMap(byName), Map.copyOf(scripts));
    }

    /**
     * Returns a snapshot in which variable {@code name} holds {@code value}: the run's own copy
     * after it wrote or read the variable. Everything else of the entry stays as it is, and this
     * snapshot is not changed.
     *
     * @throws IllegalArgumentException if the snapshot does not hold the variable
     */
    public GlobalVariableSnapshot withValue(String name, JsonNode value) {
        Entry entry = entries.get(name);
        if (entry == null) {
            throw new IllegalArgumentException("The snapshot holds no global variable '" + name + "'");
        }

        Map<String, Entry> changed = new TreeMap<>(entries);
        changed.put(name, new Entry(name, entry.version(), Objects.requireNonNull(value, "value"),
                entry.openToAll(), entry.secret(), entry.kind(), null));
        return new GlobalVariableSnapshot(Collections.unmodifiableMap(changed), scripts);
    }

    /**
     * Returns the definition of script variable {@code name}: the parsed one the snapshot was
     * taken with, or else the one its entry holds, parsed now.
     *
     * @return nothing if the snapshot holds no script of that name
     * @throws IllegalStateException if the entry holds no valid definition
     */
    public Optional<GlobalScript> script(String name) {
        Entry entry = entries.get(name);
        if (entry == null || !entry.script()) {
            return Optional.empty();
        }

        GlobalScript parsed = scripts.get(name);
        return Optional.of(parsed != null ? parsed : GlobalScript.fromJson(entry.value().toString()));
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

    /**
     * Returns the texts a log line or an echoed request must hide: every way the value of a
     * secret of this snapshot is likely written into a request. That is the text of a string or
     * a number, the compact JSON of a list or a map and the text of each value inside it, each
     * also as it reads inside a JSON string, in a URL path or query (encoded the way the request
     * builder encodes a value) and in a form body. Booleans, {@code null} and texts
     * shorter than {@link #MIN_HIDDEN_LENGTH} are not hidden, nor is a secret that could not be
     * decrypted, whose value nobody can use.
     *
     * @return the texts, in no order; empty when the snapshot holds no secret
     */
    public Set<String> secretTexts() {
        Set<String> texts = new HashSet<>();
        for (Entry entry : entries.values()) {
            if (entry.secret() && entry.isReadable()) {
                collectTexts(entry.value(), texts);
            }
        }

        return Set.copyOf(texts);
    }

    private static void collectTexts(JsonNode node, Set<String> texts) {
        if (node.isContainerNode()) {
            addHidden(node.toString(), texts);
            node.elements().forEachRemaining(child -> collectTexts(child, texts));
        } else if (node.isTextual() || node.isNumber()) {
            addHidden(node.asText(), texts);
        }
    }

    private static void addHidden(String text, Set<String> texts) {
        if (text.length() < MIN_HIDDEN_LENGTH) {
            return;
        }

        texts.add(text);
        texts.add(inJsonString(text));
        texts.add(UriUtils.encodePath(text, StandardCharsets.UTF_8));
        String inQuery = UriUtils.encodeQueryParam(text, StandardCharsets.UTF_8);
        texts.add(inQuery);
        texts.add(inQuery.replace("+", "%2B"));
        texts.add(URLEncoder.encode(text, StandardCharsets.UTF_8));
    }

    /** Returns the text as it reads between the quotes of a JSON string. */
    private static String inJsonString(String text) {
        try {
            String quoted = MAPPER.writeValueAsString(text);
            return quoted.substring(1, quoted.length() - 1);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("A text could not be written as a JSON string", e);
        }
    }
}
