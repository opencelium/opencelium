package com.becon.opencelium.backend.version_manager.base;

public class Reference<T> {
    private T value;

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }

    public Reference(T value) {
        this.value = value;
    }
}
