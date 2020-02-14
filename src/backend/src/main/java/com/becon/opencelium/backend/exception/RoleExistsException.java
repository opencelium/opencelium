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

package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.constant.ExceptionConstant;

public class RoleExistsException extends RuntimeException{

    private final String role;

    public RoleExistsException(final String role) {
        super(ExceptionConstant.ROLE_ALREADY_EXIST);
        this.role = role;
        System.err.println("Role already exists: " + role);
    }

    public String getRole() {
        return role;
    }
}
