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

public class ComparisonOperatorFactory implements OperatorFactory {

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
            case "PropertyExists":
                return new PropertyExists();
            case "PropertyNotExists":
                return new PropertyNotExists();
            case "ContainsSubStr":
                return new ContainsSubStr();
            case "NotContainsSubStr":
                return new NotContainsSubStr();
            case "Like":
                return new Like();
            case "NotLike":
                return new NotLike();
            case "Matches":
                return new Matches();
            case "IsTypeOf":
                return new IsTypeOf();
            case "DenyList":
            case "AllowList":
                return new MatchesInList();
            default:
                throw new RuntimeException("Operator '" + type + "' not supported");
        }
    }
}
