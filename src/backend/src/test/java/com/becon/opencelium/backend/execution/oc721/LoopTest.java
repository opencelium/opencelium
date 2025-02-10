package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.ConditionEx;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class LoopTest {

//    @ParameterizedTest
//    @CsvSource({
//            "i, for {%#ababab.(response).body.$.path.to.arr[*]%}, for, {%#ababab.(response).body.$.path.to.arr[*]%}, ",
//            "j, forin {%#ababab.(response).body.$.path.to.obj%}, forin, #ababab.(response).body.$.path.to.obj['*']~, ",
//            "k, forin ${key.field[*]}, forin, ${key.field[*]['*']~}, ",
//            "k, forin ${key:type}, forin, ${key['*']~:type}, ",
//            "l, {%#ababab.(response).body.$.path.to.str%} SplitString ';', SplitString, {%#ababab.(response).body.$.path.to.str%}, ;"
//    })
//    void testLoopCreation(String iterator, String expression, String expectedOperator, String expectedRef, String expectedDelimiter) {
//        // setup operator
//        ConditionEx condition = new ConditionEx();
//        condition.setExpression(expression);
//
//        OperatorEx operator = new OperatorEx();
//
//        operator.setIterator(iterator);
//        operator.setCondition(condition);
//
//        // create loop
//        Loop loop = Loop.fromEx(operator);
//
//        // assert creation
//        assertEquals(iterator, loop.getIterator());
//        assertEquals(expectedOperator, loop.getOperator().getName());
//        assertEquals(expectedRef, loop.getRef());
//        assertEquals(expectedDelimiter, loop.getDelimiter());
//    }
}