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

package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "condition")
public class ConditionMng {
    @Id
    private String id;

    @Field(name = "relational_statement")
    private String relationalOperator;
    @Field(name = "left_statement")
    @DBRef
    private StatementMng leftStatement;
    @Field(name = "right_statement")
    @DBRef
    private StatementMng rightStatement;

    public ConditionMng() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRelationalOperator() {
        return relationalOperator;
    }

    public void setRelationalOperator(String relationalOperator) {
        this.relationalOperator = relationalOperator;
    }

    public StatementMng getLeftStatement() {
        return leftStatement;
    }

    public void setLeftStatement(StatementMng leftStatement) {
        this.leftStatement = leftStatement;
    }

    public StatementMng getRightStatement() {
        return rightStatement;
    }

    public void setRightStatement(StatementMng rightStatement) {
        this.rightStatement = rightStatement;
    }
}
