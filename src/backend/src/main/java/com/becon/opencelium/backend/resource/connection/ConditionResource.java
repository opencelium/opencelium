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

package com.becon.opencelium.backend.resource.connection;

import com.becon.opencelium.backend.utility.ConditionUtility;
import jakarta.annotation.Resource;

@Resource
public class ConditionResource {

    private String relationalOperator;
    private StatementResource leftStatement;
    private StatementResource rightStatement;

    public ConditionResource() {
    }

    public String getRelationalOperator() {
        return relationalOperator;
    }

    public void setRelationalOperator(String relationalOperator) {
        this.relationalOperator = relationalOperator;
    }

    public StatementResource getLeftStatement() {
        return leftStatement;
    }

    public void setLeftStatement(StatementResource leftStatement) {
        this.leftStatement = leftStatement;
    }

    public StatementResource getRightStatement() {
        return rightStatement;
    }

    public void setRightStatement(StatementResource rightStatement) {
        this.rightStatement = rightStatement;
    }
}
