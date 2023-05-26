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

import com.becon.opencelium.backend.invoker.entity.ResponseInv;
import jakarta.annotation.Resource;
import org.springframework.hateoas.RepresentationModel;

@Resource
public class ResponseResource {

    private Long nodeId;

    private String name = "response";
    private ResultResource success;
    private ResultResource fail;

    public ResponseResource() {
    }

    public ResponseResource(ResponseInv responseInv) {
        this.success = new ResultResource(responseInv.getSuccess());

        if (responseInv.getFail() != null) {
            this.fail = new ResultResource(responseInv.getFail());
        }
    }

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public String getName() {
        return name;
    }

    public ResultResource getSuccess() {
        return success;
    }

    public void setSuccess(ResultResource success) {
        this.success = success;
    }

    public ResultResource getFail() {
        return fail;
    }

    public void setFail(ResultResource fail) {
        this.fail = fail;
    }
}
