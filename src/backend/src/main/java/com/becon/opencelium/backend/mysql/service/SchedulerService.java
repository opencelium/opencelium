/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.quartz.SchedulerException;

import javax.swing.text.html.Option;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface SchedulerService {

    void save(Scheduler scheduler);
    List<Scheduler> saveAll(List<Scheduler> schedulers);
    void deleteById(int id);
    void deleteAllById(List<Integer> schedulers);
    List<Scheduler> findAll();
    Optional<Scheduler> findById(int id);
    boolean existsByTitle(String title);
    boolean existsById(int id);
    List<Scheduler> findAllById(ArrayList<Integer> ids);

    Scheduler toEntity(SchedulerRequestResource resource);
    SchedulerResource toResource(Scheduler entity);

    void startNow(Scheduler scheduler) throws Exception;
    void saveEntity(Scheduler scheduler);
    void disable(Scheduler scheduler) throws SchedulerException;
    void enable(Scheduler scheduler) throws SchedulerException;
    List<RunningJobsResource> getAllRunningJobs() throws Exception;
}
