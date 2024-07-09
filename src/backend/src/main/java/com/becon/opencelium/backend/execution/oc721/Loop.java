package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.OperatorEx;


public class Loop {
    private String ref;
    private String delimiter;
    private String iterator;
    private int index;
    private String value;
    private RelationalOperator operator;

    public static Loop fromEx(OperatorEx operatorEx) {
        String ref = operatorEx.getCondition().getLeft();

        Loop result = new Loop();
        result.setDelimiter(operatorEx.getCondition().getRight());
        result.setIterator(operatorEx.getIterator());
        result.setOperator(operatorEx.getCondition().getRelationalOperator());

        // if loops' type is FOR_IN then add indicator
        if (result.getOperator() == RelationalOperator.FOR_IN) {
            if (ref.matches(RegExpression.webhook)) {
                int index = ref.contains(":") ? ref.indexOf(":") : ref.length() - 1;

                ref = ref.substring(0, index) + "['*']~" + ref.substring(index);
            } else {
                ref = ref + "['*']~";
            }
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
