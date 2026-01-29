package com.becon.opencelium.backend.ocel.function;

abstract class DateParse implements Function {
    @Override
    public FunctionEnum getFunctionEnum() {
        return FunctionEnum.DATE_PARSE;
    }
}
