package com.becon.opencelium.backend.mapper.utils;

public class Wrapper<T,F> {
    private T to;
    private final F from;

    public Wrapper(F from) {
        this.from = from;
    }

    public F getFrom() {
        return from;
    }

    public T getTo() {
        return to;
    }

    public void setTo(T to) {
        this.to = to;
    }
}
