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

import com.becon.opencelium.backend.database.mysql.entity.LastExecution;
import com.becon.opencelium.backend.database.mysql.repository.LastExecutionRepository;
import com.becon.opencelium.backend.resource.execution.LastExecutionResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LastExecutionServiceImp implements LastExecutionService{

    @Autowired
    private LastExecutionRepository lastExecutionRepository;

    @Override
    public boolean existsBySchedulerId(int schedulerId) {
        return lastExecutionRepository.existsBySchedulerId(schedulerId);
    }

    @Override
    public LastExecution save(LastExecution lastExecution) {
        return lastExecutionRepository.save(lastExecution);
    }

    @Override
    public LastExecution findBySchedulerId(int schedulerId) {
        return lastExecutionRepository.findBySchedulerId(schedulerId).orElse(null);
    }

    @Override
    public List<LastExecution> findAll(Pageable pageable) {
        return lastExecutionRepository.findAll(pageable).getContent();
    }

    @Override
    public LastExecutionResource toResource(LastExecution lastExecution) {
        return new LastExecutionResource(lastExecution);
    }

    @Override
    public void deleteAllBySchedulerId(int schedulerId) {
        lastExecutionRepository.deleteBySchedulerId(schedulerId);
    }
}
