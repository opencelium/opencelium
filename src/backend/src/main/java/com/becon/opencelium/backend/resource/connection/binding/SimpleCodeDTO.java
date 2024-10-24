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

package com.becon.opencelium.backend.resource.connection.binding;

import jakarta.annotation.Resource;

import java.util.List;

@Resource
public class SimpleCodeDTO {

    private int pointer;
    private List<CodeDTO> code;

    public int getPointer() {
        return pointer;
    }

    public void setPointer(int pointer) {
        this.pointer = pointer;
    }

    public List<CodeDTO> getCode() {
        return code;
    }

    public void setCode(List<CodeDTO> code) {
        this.code = code;
    }

    @Override
    public String toString() {
        return "{" +
                "\"pointer\":\"" + pointer + "\"," +
                "\"code\":" + code +
                "}";
    }
}
