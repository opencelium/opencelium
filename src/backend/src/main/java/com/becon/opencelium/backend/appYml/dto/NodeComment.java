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

package com.becon.opencelium.backend.appYml.dto;

/**
 * A documentation comment attached either to a {@link ConfigNode} (positions
 * {@code before}/{@code inline}/{@code after}) or to the file as a whole
 * (positions {@code header}/{@code footer}). The {@code text} is the comment
 * body without the leading {@code #}; adjacent block lines for the same node
 * and position are grouped into one entry joined with {@code \n}.
 */
public record NodeComment(String position, String text) {

    public static final String BEFORE = "before";
    public static final String INLINE = "inline";
    public static final String AFTER = "after";
    public static final String HEADER = "header";
    public static final String FOOTER = "footer";
}
