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

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.EventRecipient;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.exception.SchedulerNotFoundException;
import com.becon.opencelium.backend.factory.SchedulerFactory;
import com.becon.opencelium.backend.jobexecutor.SchedulingStrategy;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.quartz.SchedulerException;
import org.quartz.core.QuartzScheduler;
import org.quartz.impl.StdSchedulerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SchedulerServiceImp implements SchedulerService {

    private final ConnectionService connectionService;
    private final WebhookService webhookService;
    private final ExecutionService executionService;
    private final LastExecutionService lastExecutionService;
    private final RecipientService recipientService;
    private final MessageService messageService;
    private final SchedulingStrategy schedulingStrategy;
    private final SchedulerRepository schedulerRepository;
    private final NotificationRepository notificationRepository;



    public SchedulerServiceImp(
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("webhookServiceImp")WebhookService webhookService,
            @Qualifier("executionServiceImp")ExecutionService executionService,
            @Qualifier("lastExecutionServiceImp")LastExecutionService lastExecutionService,
            @Qualifier("messageServiceImpl")MessageService messageService,
            @Qualifier("recipientServiceImpl")RecipientService recipientService,
            SchedulerRepository schedulerRepository,
            NotificationRepository notificationRepository,
            SchedulerFactoryBean schedulerFactoryBean
    ) {
        this.connectionService = connectionService;
        this.webhookService = webhookService;
        this.executionService = executionService;
        this.lastExecutionService = lastExecutionService;
        this.recipientService = recipientService;
        this.messageService = messageService;
        this.schedulingStrategy = SchedulerFactory.createQuartzScheduler(schedulerFactoryBean.getScheduler());
        this.notificationRepository = notificationRepository;
        this.schedulerRepository = schedulerRepository;
    }

    @Override
    public void save(Scheduler scheduler) {
        Scheduler saved = schedulerRepository.save(scheduler);
        schedulingStrategy.addJob(saved);
    }

    @Override
    public List<Scheduler> saveAll(List<Scheduler> schedulers) {
        return schedulerRepository.saveAll(schedulers);
    }

    @Override
    public void deleteById(int id) {
        synchronized (this) {
            Scheduler scheduler = getById(id);
            schedulerRepository.deleteById(id);
            schedulingStrategy.deleteJob(scheduler);
        }
    }

    @Override
    public void deleteAllById(List<Integer> schedulerIds) {
        for (Integer id : schedulerIds) {
            try {
                deleteById(id);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public List<Scheduler> findAll() {
        return schedulerRepository.findAll();
    }

    @Override
    public List<Scheduler> findAllByTitleContains(String title) {
        return schedulerRepository.findAllByTitleContains(title);
    }

    @Override
    public Optional<Scheduler> findById(int id) {
        return schedulerRepository.findById(id);
    }
    @Override
    public Scheduler getById(int id) {
        return schedulerRepository.findById(id)
                .orElseThrow(()->new SchedulerNotFoundException(id));
    }

    @Override
    public List<Scheduler> findAllById(ArrayList<Integer> ids) {
        return schedulerRepository.findAllById(ids);
    }

    @Override
    public boolean existsByTitle(String title) {
        return schedulerRepository.existsByTitle(title);
    }

    @Override
    public boolean existsById(int id) {
        return schedulerRepository.existsById(id);
    }

    @Override
    public Scheduler toEntity(SchedulerRequestResource resource) {
        Connection connection = connectionService.findById(resource.getConnectionId())
                .orElseThrow(()-> new RuntimeException("Connection with id=" + resource.getConnectionId() + " not found"));
        Scheduler scheduler = new Scheduler();
        scheduler.setId(resource.getSchedulerId());
        scheduler.setTitle(resource.getTitle());
        scheduler.setStatus(resource.isStatus());
        scheduler.setCronExp(resource.getCronExp());
        scheduler.setConnection(connection);
        scheduler.setDebugMode(resource.isDebugMode());

        List<NotificationResource> notificationResources = resource.getNotificationResources();
        List<EventNotification> eventNotificationList = new ArrayList<>();

        for (NotificationResource notificationResource:notificationResources) {
            eventNotificationList.add(toNotificationEntity(notificationResource));
        }
        scheduler.setEventNotifications(eventNotificationList);
        return scheduler;
    }

    @Override
    public SchedulerResource toResource(Scheduler entity) {
        SchedulerResource schedulerResource = new SchedulerResource();
        schedulerResource.setSchedulerId(entity.getId());
        schedulerResource.setTitle(entity.getTitle());
        schedulerResource.setStatus(entity.getStatus());
        schedulerResource.setCronExp(entity.getCronExp());
        schedulerResource.setDebugMode(entity.getDebugMode());
        schedulerResource.setConnection(connectionService.toDTO(entity.getConnection()));

        if (entity.getLastExecution() != null){
            schedulerResource.setLastExecution(lastExecutionService.toResource(entity.getLastExecution()));
        }
        if (entity.getWebhook() != null){
            schedulerResource.setWebhook(webhookService.toResource(entity.getWebhook()));
        }
        List<EventNotification> eventNotificationList = entity.getEventNotifications();

        List<NotificationResource> notificationResources = new ArrayList<>();

        for (EventNotification eventNotification : eventNotificationList) {
            notificationResources.add(new NotificationResource(eventNotification));
        }

        schedulerResource.setNotification(notificationResources);

        return schedulerResource;
    }

    @Override
    public void startNow(Scheduler scheduler) throws Exception{
        schedulerRepository.save(scheduler);
        schedulingStrategy.runJob(scheduler);
    }

    @Override
    public void startNow(Scheduler scheduler, Map<String, Object> queryMap) throws Exception{
        //TODO skip it
    }

    @Override
    public void saveEntity(Scheduler scheduler) {
        schedulerRepository.save(scheduler);
    }

    @Override
    public void disable(Scheduler scheduler) throws SchedulerException {
        schedulingStrategy.pauseJob(scheduler);
    }

    @Override
    public void enable(Scheduler scheduler) throws SchedulerException {
        schedulingStrategy.resumeJob(scheduler);
    }

    @Override
    public List<RunningJobsResource> getAllRunningJobs() throws Exception{
        Map<Integer, Long> runningJobs = schedulingStrategy.getRunningJobs();
        List<RunningJobsResource> runningJobsResources = new ArrayList<>();
        runningJobs.forEach((k,v)->{
            RunningJobsResource jobsResource = new RunningJobsResource();
            Scheduler scheduler = getById(k);
            jobsResource.setSchedulerId(scheduler.getId());
            jobsResource.setTitle(scheduler.getTitle());
            Connection connection = connectionService.getById(v);
            jobsResource.setToConnector(String.valueOf(connection.getToConnector()));
            jobsResource.setFromConnector(String.valueOf(connection.getFromConnector()));
            runningJobsResources.add(jobsResource);
        });
        return runningJobsResources;
    }

    @Override
    public List<EventNotification> getAllNotifications(int schedulerId){
        return notificationRepository.findBySchedulerId(schedulerId);
    }

    @Override
    public Optional<EventNotification> getNotification(int notificationId){
        return notificationRepository.findById(notificationId);
    }

    @Override
    public EventNotification toNotificationEntity(NotificationResource resource) {
        EventNotification eventNotification = new EventNotification();
        eventNotification.setId(resource.getNotificationId());
        eventNotification.setName(resource.getName());
        eventNotification.setEventType(resource.getEventType());
        eventNotification.setScheduler(schedulerRepository.findById(resource.getSchedulerId()).orElseThrow(()->
                new RuntimeException("Scheduler "+resource.getSchedulerId()+" not found")));

        Set<EventRecipient> notificationEventRecipients = resource.getRecipients().stream()
                .map(EventRecipient::new).collect(Collectors.toSet());

        eventNotification.setEventRecipients(notificationEventRecipients);
        eventNotification.setEventMessage(messageService.findById(resource.getTemplate().getTemplateId()).orElseThrow(()->
                new RuntimeException("TEMPLATE_NOT_FOUND")));
        return eventNotification;
    }

    @Override
    public NotificationResource toNotificationResource(EventNotification eventNotification) {
        return new NotificationResource(eventNotification);
    }

    @Override
    public void saveNotification(EventNotification eventNotification) {

        notificationRepository.save(eventNotification);
        eventNotification.getEventRecipients().forEach(recipientService::save);
        messageService.save(eventNotification.getEventMessage());
    }

    @Override
    public void deleteNotificationById(int id) {
        notificationRepository.deleteById(id);
    }


}
