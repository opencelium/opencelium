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

import com.becon.opencelium.backend.invoker.entity.ResultInv;

import jakarta.annotation.Resource;
import org.springframework.hateoas.RepresentationModel;

import java.util.Map;

@Resource
public class ResultResource extends RepresentationModel {

    private Long nodeId;
    private String status;
    private Map<String, String> header;
    private BodyResource body;

    public ResultResource() {
    }

    public ResultResource(ResultInv resultInv) {
        if (resultInv.getBody() != null) {
            this.body = new BodyResource(resultInv.getBody());
        }
        this.header = resultInv.getHeader();
        this.status = resultInv.getStatus();
    }

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
