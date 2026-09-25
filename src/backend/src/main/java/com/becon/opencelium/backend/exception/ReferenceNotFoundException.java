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

/**
 * Thrown when a reference points to data that is absent at execution time:
 *
 * <ul>
 *   <li>the referenced operation has not executed, e.g. it was skipped by a condition;</li>
 *   <li>no request/response is stored for the current loop iteration.</li>
 * </ul>
 *
 * <p>Only the presence of the exchange in the container is checked - a path that is missing
 * inside a body that <em>is</em> present is not this condition.
 *
 * <p>Unlike other resolution failures - an upstream error response, a malformed body - this
 * condition is recoverable: {@code ExecutionManagerImpl} catches it, reports the reference to
 * the execution console and to the server log, substitutes an empty value and lets the
 * execution continue. It therefore never reaches the executors.
 */
public class ReferenceNotFoundException extends RuntimeException {

    public ReferenceNotFoundException(String message) {
        super(message);
    }

    public ReferenceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
