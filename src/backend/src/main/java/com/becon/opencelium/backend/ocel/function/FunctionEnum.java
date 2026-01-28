package com.becon.opencelium.backend.ocel.function;

import java.util.Arrays;

public enum FunctionEnum {

    // date-time
    CURRENT_DATE("current_date", CurrentDateProvider.getInstance()),
    CURRENT_DATE_TIME("current_date_time", CurrentDateTimeProvider.getInstance()),
    CURRENT_TIME_MILLS("current_time_mills", CurrentTimeMillsProvider.getInstance()),
    DATE_PARSE("date_parse", DateParseProvider.getInstance());

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

    public String getName() {
        return name;
    }
}