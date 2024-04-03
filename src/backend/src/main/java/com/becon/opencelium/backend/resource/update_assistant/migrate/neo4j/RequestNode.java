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

package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

public class RequestNode {

    private Long id;

    private String name = "request";
    private String method;
    private String endpoint;

    private HeaderNode headerNode;

    private BodyNode bodyNode;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getName() {
        return name;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public HeaderNode getHeaderNode() {
        return headerNode;
    }

    public void setHeaderNode(HeaderNode headerNode) {
        this.headerNode = headerNode;
    }

    public BodyNode getBodyNode() {
        return bodyNode;
    }

    public void setBodyNode(BodyNode bodyNode) {
        this.bodyNode = bodyNode;
    }
}
