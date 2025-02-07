package com.becon.opencelium.backend.ocel.function.providers;

import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.Function;
import com.becon.opencelium.backend.ocel.function.FunctionProvider;
import com.becon.opencelium.backend.ocel.function.functions.CurrentDate;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;

public class CurrentDateProvider implements FunctionProvider {
    private static final Set<CurrentDate> FUNCTION_INSTANCES = new HashSet<>();
    private static final CurrentDateProvider INSTANCE = new CurrentDateProvider();

    public static FunctionProvider getInstance() {
        return INSTANCE;
    }

    private CurrentDateProvider() {
    }

    @Override
    public Function tryFind(Object[] args) {
        return FUNCTION_INSTANCES.stream()
                .filter(x -> x.parameterListMatches(args))
                .findFirst()
                .orElse(null);
    }

    private static final CurrentDate WITH_NO_PARAMETERS = new CurrentDate() {
        @Override
        public String call(Object[] args) {
            return LocalDate.now(Clock.systemUTC()).toString();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 0;
        }
    };

    private static final CurrentDate WITH_TIME_ZONE = new CurrentDate() {
        @Override
        public String call(Object[] args) throws ApplyFunctionException {
            String timeZone = (String) (args[0]);
            return LocalDate.now(ZoneId.of(timeZone)).toString();
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 1 && args[0] instanceof String str && ZoneId.getAvailableZoneIds().contains(str);
        }
    };

    private static final CurrentDate WITH_ZONE_OFFSET = new CurrentDate() {
        @Override
        public String call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args)) {
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            }
            String offset = (String) (args[0]);
            ZoneOffset zoneOffset = ZoneOffset.of(offset);
            return LocalDate.now(zoneOffset).toString();
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
