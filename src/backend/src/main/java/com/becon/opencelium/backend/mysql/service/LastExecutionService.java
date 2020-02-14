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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.LastExecution;
import com.becon.opencelium.backend.resource.execution.LastExecutionResource;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LastExecutionService {

    LastExecution save(LastExecution lastExecution);

    boolean existsBySchedulerId(int schedulerId);

    LastExecution findBySchedulerId(int schedulerId);

    List<LastExecution> findAll(Pageable pageable);

    LastExecutionResource toResource(LastExecution lastExecution);

    void deleteAllBySchedulerId(int schedulerId);
}
