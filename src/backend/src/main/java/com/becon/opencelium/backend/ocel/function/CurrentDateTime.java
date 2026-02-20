package com.becon.opencelium.backend.ocel.function;

abstract class CurrentDateTime implements Function {
    @Override
    public FunctionEnum getFunctionEnum() {
        return FunctionEnum.CURRENT_DATE_TIME;
    }
}
