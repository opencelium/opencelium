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

import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.quartz.SchedulerException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
    List<Scheduler> findAllByTitleContains(String title);

    Scheduler toEntity(SchedulerRequestResource resource);
    SchedulerResource toResource(Scheduler entity);

    void startNow(Scheduler scheduler);
    void startNow(Scheduler scheduler, Map<String, Object> queryMap) throws Exception;
    void saveEntity(Scheduler scheduler);
    void disable(Scheduler scheduler);
    void enable(Scheduler scheduler);
    List<RunningJobsResource> getAllRunningJobs() throws Exception;

    List<EventNotification> getAllNotifications(int schedulerId);
    Optional<EventNotification> getNotification(int notificationId);
    EventNotification toNotificationEntity(NotificationResource resource);
    NotificationResource toNotificationResource(EventNotification eventNotification);
    void saveNotification(EventNotification eventNotification);
    void deleteNotificationById(int id);
    Scheduler getById(int id);
}
