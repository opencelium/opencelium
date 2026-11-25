package com.becon.opencelium.backend.database.mongodb.entity;

/**
 * One global variable of the snapshot a run read, as its execution log recorded it.
 *
 * <p>The value is kept as the JSON text the log holds, not as a document: a key of a JSON map
 * may contain a dot or start with {@code $}, which a MongoDB document key cannot hold safely.
 * The value of a secret is the mask the log wrote, never the value itself.
 */
public class LogGlobalSnapshotEntry {
    private String name;
    private Long version;
    private String value;
    private Long size;

    public LogGlobalSnapshotEntry() {
    }

    /**
     * Creates an entry.
     *
     * @param name    name of the variable
     * @param version version of the variable when the run took its snapshot, {@code null} when
     *                the log line did not tell it
     * @param value   the value as JSON text, {@code null} when the log left it out
     * @param size    bytes of the value the log left out, {@code null} when it wrote the value
     */
    public LogGlobalSnapshotEntry(String name, Long version, String value, Long size) {
        this.name = name;
        this.version = version;
        this.value = value;
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }
}
