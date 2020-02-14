/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.constant;

public interface ExceptionConstant {

    public static final String USER_NOT_EXIST = "USER_NOT_EXIST";
    public static final String EMAIL_ALREADY_EXIST = "EMAIL_ALREADY_EXIST";
    public static final String EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND";
    public static final String PASSWORD_IS_NULL = "PASSWORD_IS_NULL";
    public static final String GROUP_NOT_FOUND = "GROUP_NOT_FOUND";
    public static final String ROLE_ALREADY_EXIST = "ROLE_ALREADY_EXIST";
    public static final String UNSUPPORTED_HEADER_AUTH_TYPE = "UNSUPPORTED_HEADER_AUTH_TYPE";

    // ----------------------------------------- Storage Controller --------------------------------------- //

    String UNSUPPORTED_EXTENSION = "UNSUPPORTED_EXTENSION";

    // ----------------------------------------- Controller ----------------------------------------------- //

    String CONNECTOR_NOT_FOUND = "CONNECTOR_NOT_FOUND";
    String CONNECTOR_ALREADY_EXISTS = "CONNECTOR_ALREADY_EXISTS";

    // ----------------------------------------- Connection ----------------------------------------------- //
    String CONNECTION_NOT_FOUND = "CONNECTION_NOT_FOUND";
}
