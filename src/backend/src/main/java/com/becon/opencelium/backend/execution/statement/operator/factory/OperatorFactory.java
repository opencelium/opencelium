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

package com.becon.opencelium.backend.execution.statement.operator.factory;

import com.becon.opencelium.backend.execution.statement.operator.*;

public class OperatorFactory {

    public Operator getOperator(String type){
        switch (type){
            case "=":
                return new EqualTo();
            case "!=":
                return new NotEqualTo();
            case ">=":
                return new GreaterThanOrEqualTo();
            case "<=":
                return new LessThanOrEqualTo();
            case ">":
                return new GreaterThan();
            case "<":
                return new LessThan();
            case "IsNull":
                return new IsNull();
            case "NotNull":
                return new IsNotNull();
            case "IsEmpty":
                return new IsEmpty();
            case "NotEmpty":
                return new IsNotEmpty();
            case "Contains":
                return new Contains();
            case "NotContains":
                return new NotContains();
            default:
                throw new RuntimeException("Operator '" + type + "' not supported");
        }
    }
}