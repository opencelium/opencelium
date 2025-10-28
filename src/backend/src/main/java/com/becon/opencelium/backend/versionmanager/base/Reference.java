package com.becon.opencelium.backend.versionmanager.base;

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
