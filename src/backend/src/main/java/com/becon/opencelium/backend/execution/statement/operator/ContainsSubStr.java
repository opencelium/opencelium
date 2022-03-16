package com.becon.opencelium.backend.execution.statement.operator;

import java.util.ArrayList;
import java.util.List;

public class ContainsSubStr implements Operator {
    @Override
    public <T, S> boolean compare(T val1, S val2) {

        ArrayList arrayList = new ArrayList<>();
        if (val2 instanceof List){
            arrayList = (ArrayList) val2;
            ArrayList values = (ArrayList) arrayList.get(1);
            Object value = arrayList.get(0);

            for (Object s : values) {
                if (!(s instanceof String)) {
                    System.err.println(s);
                    throw new RuntimeException("Only String type allowed in ContainsSubStr operator");
                }

                String str = (String) s;
                if (str.contains(value.toString())) {
                    return true;
                }
            }
            return false;
        } else {
            arrayList = (ArrayList) val1;
            for (Object s : arrayList) {
                if (!(s instanceof String)) {
                    System.err.println(s);
                    throw new RuntimeException("Only String type allowed in ContainsSubStr operator");
                }

                String str = (String) s;
                if (str.contains(val2.toString())) {
                    return true;
                }
            }
            return false;
        }
    }
}
