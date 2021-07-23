/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.execution.statement.operator;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Contains implements Operator {

    // left side (var1) contains array or variable
    // right side (var2) contains variable or array that consist of two elements.
    // first element is an array of value by required property.
    // second element is a value;
    @Override
    public <T, S> boolean compare(T val1, S val2) {

        ArrayList arrayList = new ArrayList<>();
        if (val2 instanceof List){
            arrayList = (ArrayList) val2;
            ArrayList values = (ArrayList) arrayList.get(1);
            Object value = arrayList.get(0);

            boolean ans = values.contains(value);
            if (ans && (value instanceof Number)) {
                ans = values.contains(value.toString());
            }
            return ans;
        } else {
            arrayList = (ArrayList) val1;
            boolean ans = arrayList.contains(val2);
            if (ans && (val2 instanceof Number)) {
                ans = arrayList.contains(val2.toString());
            }
            return ans;
        }
    }

    private boolean isNumber(String s) {
        Pattern pattern = Pattern.compile("^[0-9]+$");
        Matcher matcher = pattern.matcher("1233ssdasd234");
        while(matcher.find()){
            return true;
        }
        return false;
    }
}
