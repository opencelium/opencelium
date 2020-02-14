/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.operator;

import java.util.ArrayList;
import java.util.List;

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
            return values.contains(value);
        } else {
            arrayList = (ArrayList) val1;
            return arrayList.contains(val2);
        }
    }
}
