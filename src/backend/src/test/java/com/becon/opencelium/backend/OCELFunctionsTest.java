package com.becon.opencelium.backend;

import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;

public class OCELFunctionsTest {
    ExpressionProcessor expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);

    @Test
    public void currentDate() throws InvalidExpressionException {
        Assertions.assertEquals(
                LocalDate.now().toString(),
                expressionProcessor.evaluate("current_date()")
        );
        Assertions.assertEquals(
                LocalDate.now(ZoneId.of("America/New_York")).toString(),
                expressionProcessor.evaluate("current_date(\"America/New_York\")")
        );
        Assertions.assertEquals(
                LocalDate.now(ZoneOffset.of("+02:00")).toString(),
                expressionProcessor.evaluate("current_date(\"+02:00\")")
        );
    }

    @Test
    public void currentDateWithComparisonOperators() throws InvalidExpressionException {
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date() = current_date(\"UTC\")")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date() > \"2012-12-12\"")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date() < \"2032-12-12\"")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date() > \"2012-12-12\"")
        );
    }


    @Test
    public void currentDateTimeWithComparisonOperators() throws InvalidExpressionException {
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date_time() >= current_date_time(\"UTC\")")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date_time() > \"2012-12-12T12:12:12\"")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date_time() < \"2032-12-12T12:12:12\"")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_date_time() > \"2012-12-12T12:12:12\"")
        );
    }

    @Test
    public void currentTimeMills() throws InvalidExpressionException {
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_time_mills() <= current_time_mills()")
        );
        Assertions.assertEquals(
                Boolean.FALSE,
                expressionProcessor.evaluate("current_time_mills() > current_time_mills()")
        );
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("current_time_mills() > 1141242141254")
        );
    }

    @Test
    public void dateFormat() throws InvalidExpressionException {
        // yyyy-MM-dd
        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("date_parse(\"2024/12/22\",\"yyyy/MM/dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")")
        );

        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("date_parse(\"12-21-2000\",\"MM-dd-yyyy\") < date_parse(\"2024/11/22\", \"yyyy/MM/dd\")")
        );

        Assertions.assertEquals(
                Boolean.TRUE,
                expressionProcessor.evaluate("date_parse(current_date(),\"yyyy-MM-dd\") > date_parse(\"2024/11/22\", \"yyyy/MM/dd\")")
        );
    }
}
