package com.becon.opencelium.backend.ocel.operand;

import com.becon.opencelium.backend.ocel.common.Component;

public class Operand implements Component {
    private Object value;
    private String rawValue;
    private boolean raw = true;

    private Operand(){}

    public static Operand withRawValue(final String rawValue) {
        Operand operand = new Operand();
        operand.rawValue = rawValue;
        return operand;
    }
    public static Operand withValue(final Object value) {
        Operand operand = new Operand();
        operand.value = value;
        operand.raw = false;
        return operand;
    }

    public Object getValue() {
        return value;
    }

    public boolean isRaw() {
        return raw;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public void setRaw(boolean raw) {
        this.raw = raw;
    }

    public String getRawValue() {
        return rawValue;
    }

    public void setRawValue(String rawValue) {
        this.rawValue = rawValue;
    }
}
