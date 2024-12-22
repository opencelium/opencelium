package com.becon.opencelium.backend.ocel.function.providers;

import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.Function;
import com.becon.opencelium.backend.ocel.function.FunctionProvider;
import com.becon.opencelium.backend.ocel.function.functions.CurrentTimeMills;

public class CurrentTimeMillsProvider implements FunctionProvider {
    private static final CurrentTimeMillsProvider INSTANCE = new CurrentTimeMillsProvider();

    public static FunctionProvider getInstance() {
        return INSTANCE;
    }

    public static final CurrentTimeMills DEFAULT_FUNCTION = new CurrentTimeMills() {
        @Override
        public Object call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args))
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            return System.currentTimeMillis();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 0;
        }
    };

    @Override
    public Function tryFind(Object[] args) {
        if (DEFAULT_FUNCTION.parameterListMatches(args)) {
            return DEFAULT_FUNCTION;
        }
        return null;
    }
}
