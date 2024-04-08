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

public class ResponseNode {

    private Long id;
    private String name = "response";
    private ResultNode success;
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
