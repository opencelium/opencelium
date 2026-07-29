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
import com.becon.opencelium.backend.enums.ConnectorStatus;
import org.springframework.http.HttpStatusCode;

import java.util.Date;

/**
 * Determines the health of a connector's remote API by sending the invoker's
 * test request and classifying the outcome.
 */
public interface ConnectorHealthService {

    /**
     * Runs the invoker's test request against the connector's remote API and classifies
     * the outcome. A request that cannot be completed (host unreachable, timeout, ...)
     * yields {@link ConnectorStatus#DOWN}; classification itself never throws for that
     * case. The connector must carry decrypted request data.
     */
    CheckResult check(Connector connector);

    /**
     * Outcome of a single health check.
     *
     * @param status     classified health of the remote API
     * @param error      remote error message; {@code null} when {@code status} is {@code UP}
     * @param latencyMs  wall-clock duration of the remote request
     * @param checkedAt  when the check finished
     * @param httpStatus raw HTTP status of the test response; {@code null} when the
     *                   request itself failed ({@code status} is {@code DOWN})
     */
    record CheckResult(
            ConnectorStatus status,
            String error,
            long latencyMs,
            Date checkedAt,
            HttpStatusCode httpStatus) {
    }
}
