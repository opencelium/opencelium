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

package com.becon.opencelium.backend.enums;

public enum HttpResponseEnum {
    USER_NOT_FOUND,
    EMAIL_NOT_FOUND,
    EMAIL_ALREADY_EXISTS,
    USER_GROUP_NOT_FOUND,
    PASSWORD_IS_EMPTY,
    EMAIL_IS_EMPTY,
    SCHEDULE_NOT_EXISTS,
    CONNECTION_NOT_EXISTS,
    CONNECTION_ID_NULL,
    CONNECTION_FAILED,
    NO_HEADER_AUTHORIZATION,
    TOKEN_EXPIRED,
    TOKEN_ID_NOT_MATCH,
    INACTIVE_TIME,
    RESOURCE_ACCESS_DENIED,
    EXIST_IN_CONNECTION,
    USER_DETAIL_NOT_EXISTS,
}
