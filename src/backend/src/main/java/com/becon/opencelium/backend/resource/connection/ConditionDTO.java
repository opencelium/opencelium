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

import jakarta.annotation.Resource;

@Resource
public class ConditionDTO {

    private String relationalOperator;
    private StatementDTO leftStatement;
    private StatementDTO rightStatement;

    public ConditionDTO() {
    }

    public String getRelationalOperator() {
        return relationalOperator;
    }

    public void setRelationalOperator(String relationalOperator) {
        this.relationalOperator = relationalOperator;
    }

    public StatementDTO getLeftStatement() {
        return leftStatement;
    }

    public void setLeftStatement(StatementDTO leftStatement) {
        this.leftStatement = leftStatement;
    }

    public StatementDTO getRightStatement() {
        return rightStatement;
    }

    public void setRightStatement(StatementDTO rightStatement) {
        this.rightStatement = rightStatement;
    }
}
