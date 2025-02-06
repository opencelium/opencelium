package com.becon.opencelium.backend.ocel.function.providers;

import com.becon.opencelium.backend.ocel.common.Constants;
import com.becon.opencelium.backend.ocel.exception.ApplyFunctionException;
import com.becon.opencelium.backend.ocel.function.Function;
import com.becon.opencelium.backend.ocel.function.FunctionProvider;
import com.becon.opencelium.backend.ocel.function.functions.DateParse;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class DateParseProvider implements FunctionProvider {
    @Override
    public Function tryFind(Object[] args) {
        if (DATE_PARSE_FUNC.parameterListMatches(args)) {
            return DATE_PARSE_FUNC;
        }
        return null;
    }

    private static final DateParseProvider INSTANCE = new DateParseProvider();

    private DateParseProvider() {
    }

    public static DateParseProvider getInstance() {
        return INSTANCE;
    }

    private static final DateParse DATE_PARSE_FUNC = new DateParse() {
        @Override
        public Object call(Object[] args) throws ApplyFunctionException {
            if (!parameterListMatches(args)) {
                throw ApplyFunctionException.invalidParamList(getFunctionEnum(), args);
            }
            String var1 = (String) args[0]; // date
            String var2 = (String) args[1]; // date's format
            try {
                LocalDate date = LocalDate.parse(var1, DateTimeFormatter.ofPattern(var2));
                return date.format(DateTimeFormatter.ofPattern(Constants.DEFAULT_DATE_FORMAT));
            } catch (DateTimeParseException e) {
                throw ApplyFunctionException.invalidParameterValue(getFunctionEnum(), var1, 0, "Date MUST be in '%s' format".formatted(var2));
            } catch (IllegalArgumentException e) {
                throw ApplyFunctionException.invalidParameterValue(getFunctionEnum(), var2, 1, "Given format is not valid");
            }
        }

        @Override
        public boolean parameterListMatches(Object[] args) {
            return args.length == 2
                    && args[0] instanceof String
                    && args[1] instanceof String;
        }
    };
}
