package com.becon.opencelium.backend.ocel.function;

abstract class CurrentDate implements Function {
    @Override
    public FunctionEnum getFunctionEnum() {
        return FunctionEnum.CURRENT_DATE;
    }
}
