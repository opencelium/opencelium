package com.becon.opencelium.backend.ocel.function;

abstract class CurrentTimeMills implements Function {
    @Override
    public FunctionEnum getFunctionEnum() {
        return FunctionEnum.CURRENT_TIME_MILLS;
    }
}
