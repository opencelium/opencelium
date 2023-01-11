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

@Node("Connection")
public class ConnectionNode {

    @Id
    @GeneratedValue(UUIDStringGenerator.class)
    private Long id;

//    @Index
    private Long connectionId;
    private String name;

    @Relationship(type = "from_connector", direction = Relationship.Direction.OUTGOING)
    private ConnectorNode fromConnector;

    @Relationship(type = "to_connector", direction = Relationship.Direction.OUTGOING)
    private ConnectorNode toConnector;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ConnectorNode getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorNode fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorNode getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorNode toConnector) {
        this.toConnector = toConnector;
    }
}
