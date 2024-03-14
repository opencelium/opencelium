package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.resource.execution.OperatorEx;

import java.util.List;

public class Loop {
    private String listRef;
    private List<String> loopingList;
    private String counterName;
    private String counterValue;
    private RelationalOperator operator;

    public static Loop fromEx(OperatorEx operatorEx) {
        Loop result = new Loop();

        result.setListRef(operatorEx.getCondition().getLeft());
        result.setCounterName(operatorEx.getIterator());
        result.setOperator(operatorEx.getCondition().getRelationalOperator());

        return result;
    }

    public String getListRef() {
        return listRef;
    }

    private void setListRef(String listRef) {
        this.listRef = listRef;
    }

    public List<String> getLoopingList() {
        return loopingList;
    }

    public void setLoopingList(List<String> loopingList) {
        this.loopingList = loopingList;
    }

    public String getCounterName() {
        return counterName;
    }

    private void setCounterName(String counterName) {
        this.counterName = counterName;
    }

    public String getCounterValue() {
        return counterValue;
    }

    public void setCounterValue(String counterValue) {
        this.counterValue = counterValue;
    }

    public RelationalOperator getOperator() {
        return operator;
    }

    private void setOperator(RelationalOperator operator) {
        this.operator = operator;
    }
}
