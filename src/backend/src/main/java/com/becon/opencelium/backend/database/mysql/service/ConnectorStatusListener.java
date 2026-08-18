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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService.CheckResult;
import com.becon.opencelium.backend.enums.ConnectorStatus;

/**
 * Callback invoked by {@link ConnectorHealthService#runCheck} after a damped status
 * transition has been persisted. Implemented by the WebSocket publisher; when no
 * implementation is registered, transitions are simply not broadcast.
 */
@FunctionalInterface
public interface ConnectorStatusListener {

    /**
     * Called strictly after the new status has been written to the database.
     *
     * @param connector the checked connector (state as loaded for the check)
     * @param newStatus the freshly persisted status
     * @param result    the raw check outcome that triggered the transition
     */
    void onStatusTransition(Connector connector, ConnectorStatus newStatus, CheckResult result);
}
