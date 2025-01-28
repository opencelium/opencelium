package com.becon.opencelium.backend.version_manager;

import java.util.function.Consumer;

public class Wrapper<T> {
    private final T data;
    private final boolean updated;
    private boolean changed;
    private String oldVersion;
    private String newVersion;

    private Wrapper(T data) {
        this(data, false, false);
    }

    public Wrapper(T data, boolean updated) {
        this(data, updated, false);
    }

    public Wrapper(T data, boolean updated, boolean changed) {
        this.data = data;
        this.updated = updated;
        this.changed = changed;
    }

    public static <T> Wrapper<T> notUpdated(T data) {
        return new Wrapper<>(data);
    }

    public static <T> Wrapper<T> updated(T data) {
        return new Wrapper<>(data, true);
    }

    public Wrapper<T> changed(boolean changed) {
        this.changed = changed;
        return this;
    }

    public Wrapper<T> withOldVersion(String oldVersion) {
        this.oldVersion = oldVersion;
        return this;
    }

    public Wrapper<T> withNewVersion(String newVersion) {
        this.newVersion = newVersion;
        return this;
    }

    public void ifUpdated(Consumer<T> consumer) {
        if (updated) {
            consumer.accept(data);
        }
    }

    public void ifChangedOrElseIfUpdated(Consumer<T> onChanged, Consumer<T> onUpdated) {
        if (changed) {
            onChanged.accept(data);
        } else if (updated) {
            onUpdated.accept(data);
        }
    }

    public void ifChanged(Consumer<T> consumer) {
        if (changed) {
            consumer.accept(data);
        }
    }

    public T getData() {
        return data;
    }

    public boolean isUpdated() {
        return updated;
    }

    public String getOldVersion() {
        return oldVersion;
    }

    public String getNewVersion() {
        return newVersion;
    }
}
