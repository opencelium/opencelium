package com.becon.opencelium.backend.ocel.function;

import com.becon.opencelium.backend.ocel.function.providers.CurrentDateProvider;

import java.util.Arrays;

public enum FunctionEnum {

    CURRENT_DATE("current_date", CurrentDateProvider.getInstance());

    private final String name;
    private final FunctionProvider provider;

    FunctionEnum(String name, FunctionProvider provider) {
        this.name = name;
        this.provider = provider;
    }

    public static FunctionEnum fromNameNullable(String name) {
        return Arrays.stream(FunctionEnum.values())
                .filter(f -> f.name.equals(name))
                .findFirst()
                .orElse(null);
    }

    public FunctionProvider getProvider() {
        return provider;
    }
}