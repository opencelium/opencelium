package com.becon.opencelium.backend.ocel.base;

public class ValidatorFactory {
    public static Validator get() {
        return ValidatorImpl.getInstance();
    }
}
