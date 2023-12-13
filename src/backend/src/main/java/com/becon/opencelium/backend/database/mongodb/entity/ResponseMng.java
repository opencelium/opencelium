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

import com.becon.opencelium.backend.invoker.entity.ResponseInv;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "response")
public class ResponseMng {

    @Id
    private String id;

    private String name = "response";
    @DBRef
    private ResultMng success;
    @DBRef
    private ResultMng fail;

    public ResponseMng() {
    }

    public ResponseMng(ResponseInv responseInv) {
        this.success = new ResultMng(responseInv.getSuccess());

        if (responseInv.getFail() != null) {
            this.fail = new ResultMng(responseInv.getFail());
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public ResultMng getSuccess() {
        return success;
    }

    public void setSuccess(ResultMng success) {
        this.success = success;
    }

    public ResultMng getFail() {
        return fail;
    }

    public void setFail(ResultMng fail) {
        this.fail = fail;
    }
}
