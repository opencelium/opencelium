package com.becon.opencelium.backend.ocel.function.functions;

import com.becon.opencelium.backend.ocel.function.Function;
import com.becon.opencelium.backend.ocel.function.FunctionEnum;

public abstract class CurrentTimeMills implements Function {
    @Override
    public FunctionEnum getFunctionEnum() {
        return FunctionEnum.CURRENT_TIME_MILLS;
    }
}
