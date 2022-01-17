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

import static java.util.stream.Collectors.*;

public class IsNotEmpty implements Operator{


    @Override
    public <T, S> boolean compare(T val1, S val2) {
        if ( !(val1 instanceof List) ) {
            throw new RuntimeException("isNotEmpty() would be used with an Array");
        }
        ArrayList<T> arrayList = new ArrayList<T>((ArrayList)val1);
        return !arrayList.isEmpty();
    }
}
