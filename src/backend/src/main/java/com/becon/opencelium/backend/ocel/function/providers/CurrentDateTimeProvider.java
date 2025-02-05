package com.becon.opencelium.backend.ocel.function.providers;

import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.Function;
import com.becon.opencelium.backend.ocel.function.FunctionProvider;
import com.becon.opencelium.backend.ocel.function.functions.CurrentDateTime;

import java.time.*;
import java.util.HashSet;
import java.util.Set;

public class CurrentDateTimeProvider implements FunctionProvider {
    public static final CurrentDateTimeProvider INSTANCE = new CurrentDateTimeProvider();
    private static final Set<CurrentDateTime> FUNCTION_INSTANCES = new HashSet<>();

    private CurrentDateTimeProvider() {}

    public static FunctionProvider getInstance() {
        return INSTANCE;
    }

    @Override
    public Function tryFind(Object[] args) {
        return FUNCTION_INSTANCES.stream()
                .filter(x -> x.parameterListMatches(args))
                .findFirst()
                .orElse(null);
    }

    private static final CurrentDateTime WITH_NO_PARAMETERS = new CurrentDateTime() {
        @Override
        public String call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args)) {
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            }
            return LocalDateTime.now(Clock.systemUTC()).toString();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 0;
        }
    };

    private static final CurrentDateTime WITH_TIME_ZONE = new CurrentDateTime() {
        @Override
        public String call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args)) {
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            }
            String timeZone = (String) (args[0]);
            return LocalDateTime.now(ZoneId.of(timeZone)).toString();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 1 && args[0] instanceof String str && ZoneId.getAvailableZoneIds().contains(str);
        }
    };

    private static final CurrentDateTime WITH_ZONE_OFFSET = new CurrentDateTime() {
        @Override
        public String call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args)) {
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            }
            String offset = (String) (args[0]);
            ZoneOffset zoneOffset = ZoneOffset.of(offset);
            return LocalDateTime.now(zoneOffset).toString();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            if (args.length == 1 && args[0] instanceof String str) {
                try {
                    ZoneOffset.of(str);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
            return false;
        }
    };

    static {
        FUNCTION_INSTANCES.add(WITH_NO_PARAMETERS);
        FUNCTION_INSTANCES.add(WITH_TIME_ZONE);
        FUNCTION_INSTANCES.add(WITH_ZONE_OFFSET);
    }
}
