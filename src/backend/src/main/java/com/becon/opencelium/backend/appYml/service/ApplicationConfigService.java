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

package com.becon.opencelium.backend.appYml.service;

import com.becon.opencelium.backend.appYml.dto.ApplicationConfigResponse;
import com.fasterxml.jackson.databind.JsonNode;

public interface ApplicationConfigService {

    ApplicationConfigResponse read();

    /**
     * Applies the {@code fields} array of the PATCH envelope to the on-disk
     * {@code application.yml}: edits values, adds new keys, and disables
     * ({@code status: inactive}) nodes. Comments are read-only and preserved.
     */
    void patch(JsonNode fields);
}
