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

package com.becon.opencelium.backend.neo4j.entity;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import org.springframework.data.neo4j.core.support.UUIDStringGenerator;

@Node("Response")
public class ResponseNode {

    @Id
    @GeneratedValue
    private Long id;
    private String name = "response";
    @Relationship(type = "has_success", direction = Relationship.Direction.OUTGOING)
    private ResultNode success;
    @Relationship(type = "has_fail", direction = Relationship.Direction.OUTGOING)
    private ResultNode fail;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public ResultNode getSuccess() {
        return success;
    }

    public void setSuccess(ResultNode success) {
        this.success = success;
    }

    public ResultNode getFail() {
        return fail;
    }

    public void setFail(ResultNode fail) {
        this.fail = fail;
    }
}
