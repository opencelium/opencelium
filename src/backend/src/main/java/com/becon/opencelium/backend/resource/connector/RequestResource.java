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

package com.becon.opencelium.backend.resource.connector;

import com.becon.opencelium.backend.invoker.entity.RequestInv;
import jakarta.annotation.Resource;
import org.springframework.hateoas.RepresentationModel;

import java.util.Map;

@Resource
public class RequestResource {

    private String nodeId;
    private String endpoint;
    private String method;
    private Map<String, String> header;
    private BodyResource body;

    public RequestResource() {
    }

    public RequestResource(RequestInv requestInv) {
        this.endpoint = requestInv.getEndpoint();
        this.method = requestInv.getMethod();
        this.header = requestInv.getHeader();
        if (requestInv.getBody() != null) {
            this.body = new BodyResource(requestInv.getBody());
        }
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Map<String, String> getHeader() {
        return header;
    }

    public void setHeader(Map<String, String> header) {
        this.header = header;
    }

    public BodyResource getBody() {
        return body;
    }

    public void setBody(BodyResource body) {
        this.body = body;
    }
}
