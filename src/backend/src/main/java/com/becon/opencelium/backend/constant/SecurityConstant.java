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

package com.becon.opencelium.backend.constant;

public interface SecurityConstant {
    public static final String SECRET = "84bbce3d33de467b47b7e76c256376943f9aff968def8ef2674856f67ae8a93f";
    public static final long EXPIRATION_TIME = 24 * 60 * 60;
    public static final long ACTIVITY_TIME = 5 * 60 * 60;
    public static final String BEARER = "Bearer";
    public static final char LOCKED = '1';
    int CONN_REQ_TIMEOUT = 5 * 1000; //milliseconds
    int READ_TIMEOUT = 5 * 1000; //milliseconds
    int CONN_TIMEOUT = 5 * 1000; //milliseconds
}
