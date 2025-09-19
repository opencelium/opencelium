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
import org.springframework.http.HttpStatus;

public class ConcurrentTestIsForbidden extends GeneralServiceException {

    private final Long id;

    public ConcurrentTestIsForbidden(final Long id) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, "Connection is currently being executed, id = " + id, ExceptionConstant.CONCURRENT_TEST_IS_FORBIDDEN);
        this.id = id;
    }

    public Long getId() {
        return id;
    }
}
