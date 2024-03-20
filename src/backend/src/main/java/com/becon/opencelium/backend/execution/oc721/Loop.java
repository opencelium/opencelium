package com.becon.opencelium.backend.execution.oc721;

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
        Loop result = new Loop();

        result.setRef(operatorEx.getCondition().getLeft());
        result.setDelimiter(operatorEx.getCondition().getRight());
        result.setIterator(operatorEx.getIterator());
        result.setOperator(operatorEx.getCondition().getRelationalOperator());

        return result;
    }

    public boolean hasSameRef(String reference) {
        String[] actualRefParts = ref.split("\\.");
        String[] potentialRefParts = reference.split("\\.");

        // 'reference' should contain 'ref' as it is a specific part of it:
        if (actualRefParts.length > potentialRefParts.length) {
            return false;
        }

        String part;
        for (int i = 0; i < actualRefParts.length; i++) {
            // if 'part' contains index then remove it, otherwise take whole part
            if (actualRefParts[i].contains("[")) {
                part = actualRefParts[i].substring(0, actualRefParts[i].indexOf('['));
            } else {
                part = actualRefParts[i];
            }

            // 'potentialRefParts[i]' should contain part
            if (!potentialRefParts[i].contains(part)) {
                return false;
            }
        }

        return true;
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
