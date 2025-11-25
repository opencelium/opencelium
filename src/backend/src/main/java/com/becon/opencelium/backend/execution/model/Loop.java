package com.becon.opencelium.backend.execution.model;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.utility.ReferenceUtility;

import static com.becon.opencelium.backend.enums.RelationalOperator.FOR;
import static com.becon.opencelium.backend.enums.RelationalOperator.FOR_IN;
import static com.becon.opencelium.backend.enums.RelationalOperator.SPLIT_STRING;


public class Loop {
    private String ref;
    private String delimiter;
    private String iterator;
    private int index;
    private String value;
    private RelationalOperator operator;

    public static Loop fromEx(OperatorEx operatorEx) {
        Loop result = new Loop();

        result.setIterator(operatorEx.getIterator());

        String expression = operatorEx.getExpression();

        String ref = ReferenceUtility.extractRef(expression, RegExpression.wrappedDirectRef);
        if (expression.startsWith(FOR_IN.getName())) {
            result.setOperator(FOR_IN);

            if (ref == null) {
                // then 'ref' is a 'webhook'
                ref = ReferenceUtility.extractRef(expression, RegExpression.webhook);

                int index = ref.contains(":") ? ref.indexOf(":") : ref.length() - 1;
                ref = ref.substring(0, index) + "['*']~" + ref.substring(index);
            } else {
                ref = ReferenceUtility.extractDirectRef(ref) + "['*']~";
            }
        } else if (expression.startsWith(FOR.getName())) {
            result.setOperator(FOR);
        } else {
            result.setOperator(SPLIT_STRING);

            String delimiter = expression.replace(ref, "")
                    .replace(SPLIT_STRING.getName(), "")
                    .replace("'", "")
                    .trim();

            result.setDelimiter(delimiter);
        }
        result.setRef(ref);

        return result;
    }

    public static boolean isIterator(String str) {
        return str != null && str.length() == 1 && Character.isLetter(str.charAt(0));
    }

    public String getRef() {
        return ref;
    }

    private void setRef(String ref) {
        this.ref = ref;
    }

    public String getDelimiter() {
        return delimiter;
    }

    private void setDelimiter(String delimiter) {
        this.delimiter = delimiter;
    }

    public String getIterator() {
        return iterator;
    }

    private void setIterator(String iterator) {
        this.iterator = iterator;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public RelationalOperator getOperator() {
        return operator;
    }

    private void setOperator(RelationalOperator operator) {
        this.operator = operator;
    }
}
