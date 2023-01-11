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

@Node("Connector")
public class ConnectorNode {

    @Id
    @GeneratedValue(UUIDStringGenerator.class)
    private Long id;

    private Integer connectorId;
    private String name;
    private String webService;

    @Relationship(type = "start_action", direction = Relationship.Direction.OUTGOING)
    private MethodNode startMethod;

    @Relationship(type = "start_action", direction = Relationship.Direction.OUTGOING)
    private StatementNode startOperator;

    public ConnectorNode() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getWebService() {
        return webService;
    }

    public void setWebService(String webService) {
        this.webService = webService;
    }

    public MethodNode getStartMethod() {
        return startMethod;
    }

    public void setStartMethod(MethodNode startMethod) {
        this.startMethod = startMethod;
    }

    public StatementNode getStartOperator() {
        return startOperator;
    }

    public void setStartOperator(StatementNode startOperator) {
        this.startOperator = startOperator;
    }
}
