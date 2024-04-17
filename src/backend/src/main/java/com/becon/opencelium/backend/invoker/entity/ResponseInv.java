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

package com.becon.opencelium.backend.invoker.entity;

import com.becon.opencelium.backend.resource.connector.ResponseDTO;

public class ResponseInv {
    private ResultInv success;
    private ResultInv fail;

    public ResponseInv() {
    }

    public ResponseInv(ResponseDTO responseDTO) {
        this.success = new ResultInv(responseDTO.getSuccess());
        this.fail = new ResultInv(responseDTO.getFail());
    }

    public ResultInv getSuccess() {
        return success;
    }

    public void setSuccess(ResultInv success) {
        this.success = success;
    }

    public ResultInv getFail() {
        return fail;
    }

    public void setFail(ResultInv fail) {
        this.fail = fail;
    }
}
