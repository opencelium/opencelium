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

import com.becon.opencelium.backend.configuration.CacheConfiguration;
import com.becon.opencelium.backend.database.mysql.entity.Execution;
import com.becon.opencelium.backend.database.mysql.repository.ExecutionRepository;
import com.becon.opencelium.backend.database.mysql.repository.projection.ExecutionStatsProjection;
import com.becon.opencelium.backend.resource.application.ExecutionStatsDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ExecutionServiceImp implements ExecutionService {

    private static final Logger log = LoggerFactory.getLogger(ExecutionServiceImp.class);

    private final ExecutionRepository executionRepository;

    public ExecutionServiceImp(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    @Override
    @CacheEvict(CacheConfiguration.EXECUTION_STATS)
    public Execution save(Execution execution) {
        log.debug("[Cache] '{}' evicted", CacheConfiguration.EXECUTION_STATS);
        return executionRepository.save(execution);
    }

    @Override
    public List<Execution> getExecutionsBySchedulerId(int schedulerId) {
        return executionRepository.findBySchedulerId(schedulerId);
    }

    @Override
    public List<Execution> findAll() {
        return executionRepository.findAll();
    }

    @Override
    @Cacheable(CacheConfiguration.EXECUTION_STATS)
    public ExecutionStatsDTO getStats() {
        log.debug("[Cache] '{}' miss — querying DB", CacheConfiguration.EXECUTION_STATS);
        ExecutionStatsProjection p = executionRepository.getAggregatedStats();
        return new ExecutionStatsDTO(
                p.getTotalExecs().intValue(),
                p.getTotalFailed().intValue(),
                p.getTotalRuntime().longValue(),
                Math.round(p.getAvgRuntime())
        );
    }

    @Override
    public Optional<Execution> findById(long id) {
        return executionRepository.findById(id);
    }

    @Override
    public Execution getById(long id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("EXECUTION_NOT_FOUND"));
    }

    public double getAvgDurationOfExecution(int schedulerId) {
        List<Execution> executions = getExecutionsBySchedulerId(schedulerId);
        List<Long> diffArray = new ArrayList<>();
        for (Execution e : executions) {
            if (e.getEndTime() == null || !e.getStatus().equals("S")) {
                continue;
            }
            long endTime = e.getEndTime().getTime();
            long startTime = e.getStartTime().getTime();

            diffArray.add(endTime - startTime);
        }

        return diffArray.stream().mapToDouble((x) -> x).average().orElse(0);
    }
}
