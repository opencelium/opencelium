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

import java.util.List;

/**
 * One field in {@code application.yml}, whether enabled or commented-out.
 *
 * <p>Nesting is expressed through {@link #value}: a leaf's value is a scalar
 * {@link com.fasterxml.jackson.databind.JsonNode} (or a JSON array of scalars);
 * a container's value is a {@code List<ConfigNode>} of its children. The
 * {@link #status} is {@code active} when the key is uncommented on disk and
 * {@code inactive} when it is commented-out.</p>
 */
public record ConfigNode(
        String key,
        String path,
        String status,
        Object value,
        List<NodeComment> comments
) {

    public static final String ACTIVE = "active";
    public static final String INACTIVE = "inactive";
}
