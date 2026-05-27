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

package com.becon.opencelium.backend.applicationConfig.dto;

public record YamlComment(String path, String position, String text) {

    public static final String POSITION_BEFORE = "before";
    public static final String POSITION_INLINE = "inline";
    public static final String POSITION_AFTER = "after";

    public static final String HEADER_PATH = "$.header";
    public static final String FOOTER_PATH = "$.footer";
}
