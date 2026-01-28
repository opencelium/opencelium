package com.becon.opencelium.backend.ocel.operator;

class Dummy {
    private static final Dummy DUMMY = new Dummy();

    private Dummy() {
    }

    public static Dummy get() {
        return DUMMY;
    }
}
