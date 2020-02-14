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

import com.becon.opencelium.backend.mysql.entity.Execution;
import com.becon.opencelium.backend.mysql.repository.ExecutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExecutionServiceImp implements ExecutionService{
    @Autowired
    private ExecutionRepository executionRepository;

    @Override
    public void save(Execution execution) {
        executionRepository.save(execution);
    }

    @Override
    public void deleteAllBySchedulerId(int schedulerId) {
        executionRepository.deleteBySchedulerId(schedulerId);
    }

    @Override
    public List<Execution> getExecutionsBySchedulerId(int schedulerId) {
        return executionRepository.findBySchedulerId(schedulerId);
    }

    public double getAvgDurationOfExecution(int schedulerId) {
        List<Execution> executions = getExecutionsBySchedulerId(schedulerId);
        List<Long> diffArray = new ArrayList<>();
        for (Execution e : executions){
            if (e.getEndTime() == null || !e.getStatus().equals("S")){
                continue;
            }
            long endTime = e.getEndTime().getTime();
            long startTime = e.getStartTime().getTime();

            diffArray.add(endTime - startTime);
        }

        return diffArray.stream().mapToDouble((x) -> x).average().orElse(0);
    }
}
