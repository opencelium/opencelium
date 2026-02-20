package com.becon.opencelium.backend.ocel.function;

import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;

class CurrentTimeMillsProvider implements FunctionProvider {
    private static final CurrentTimeMillsProvider INSTANCE = new CurrentTimeMillsProvider();

    private CurrentTimeMillsProvider() {}

    public static FunctionProvider getInstance() {
        return INSTANCE;
    }

    @Override
    public Function tryFind(Object[] args) {
        if (DEFAULT_FUNCTION.parameterListMatches(args)) {
            return DEFAULT_FUNCTION;
        }
        return null;
    }

    private static final CurrentTimeMills DEFAULT_FUNCTION = new CurrentTimeMills() {
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
}
