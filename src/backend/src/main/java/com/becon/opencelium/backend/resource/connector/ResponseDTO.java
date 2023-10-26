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

@Resource
public class ResponseDTO {

    private String nodeId;

    private String name = "response";
    private ResultDTO success;
    private ResultDTO fail;

    public ResponseDTO() {
    }

    public ResponseDTO(ResponseInv responseInv) {
        this.success = new ResultDTO(responseInv.getSuccess());

        if (responseInv.getFail() != null) {
            this.fail = new ResultDTO(responseInv.getFail());
        }
    }

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getName() {
        return name;
    }

    public ResultDTO getSuccess() {
        return success;
    }

    public void setSuccess(ResultDTO success) {
        this.success = success;
    }

    public ResultDTO getFail() {
        return fail;
    }

    public void setFail(ResultDTO fail) {
        this.fail = fail;
    }
}
