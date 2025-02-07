package com.becon.opencelium.backend.ocel.function;

public abstract class FunctionFactory {
    public static Function function(final String functionName, final Object[] args) {
        FunctionEnum functionEnum = FunctionEnum.fromNameNullable(functionName);
        return functionEnum == null
                ? null
                : functionEnum.getProvider().tryFind(args);
    }
}
