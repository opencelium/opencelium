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

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.EventRecipient;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.exception.ConcurrentTestIsForbidden;
import com.becon.opencelium.backend.exception.SchedulerNotFoundException;
import com.becon.opencelium.backend.factory.SchedulerFactory;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.quartz.SchedulingStrategy;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJob;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SchedulerServiceImp implements SchedulerService {

    private final ConnectionService connectionService;
    private final WebhookService webhookService;
    private final ConnectorService connectorService;
    private final LastExecutionService lastExecutionService;
    private final RecipientService recipientService;
    private final MessageService messageService;
    private final SchedulingStrategy schedulingStrategy;
    private final SchedulerRepository schedulerRepository;
    private final NotificationRepository notificationRepository;
    private final ExecutionService executionService;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;


    public SchedulerServiceImp(
            @Lazy @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("webhookServiceImp") WebhookService webhookService,
            @Qualifier("lastExecutionServiceImp") LastExecutionService lastExecutionService,
            @Qualifier("messageServiceImpl") MessageService messageService,
            @Qualifier("recipientServiceImpl") RecipientService recipientService,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            SchedulerRepository schedulerRepository,
            NotificationRepository notificationRepository,
            SchedulerFactoryBean schedulerFactoryBean,
            ExecutionService executionService,
            Mapper<Connection, ConnectionDTO> connectionMapper
    ) {
        this.connectionService = connectionService;
        this.webhookService = webhookService;
        this.lastExecutionService = lastExecutionService;
        this.recipientService = recipientService;
        this.messageService = messageService;
        this.schedulingStrategy = SchedulerFactory.createQuartzScheduler(schedulerFactoryBean.getScheduler());
        this.notificationRepository = notificationRepository;
        this.schedulerRepository = schedulerRepository;
        this.executionService = executionService;
        this.connectionMapper = connectionMapper;
        this.connectorService = connectorService;
    }

    @Override
    @Transactional(rollbackFor = {RuntimeException.class})
    public void save(@NonNull Scheduler scheduler) {
        // As requested by the UI team, the title in the scheduler will no longer be used.
//        if (existsByTitle(scheduler.getTitle())) {
//            throw new RuntimeException("TITLE_ALREADY_EXISTS");
//        }
        Scheduler saved = schedulerRepository.save(scheduler);
        schedulingStrategy.addJob(saved);
    }

    @Override
    @Transactional(rollbackFor = {RuntimeException.class})
    public Scheduler update(@NonNull Scheduler scheduler) {

        Scheduler entity = getById(scheduler.getId());
        Long oldCon = entity.getConnection().getId();
        if (!Objects.equals(entity.getTitle(), scheduler.getTitle()) && existsByTitle(scheduler.getTitle())) {
            throw new RuntimeException("TITLE_ALREADY_EXISTS");
        }

        schedulerRepository.save(scheduler);
        schedulingStrategy.rescheduleJob(scheduler, oldCon);
        return scheduler;
    }

    @Override
    public List<Scheduler> saveAll(List<Scheduler> schedulers) {
        return schedulerRepository.saveAll(schedulers);
    }

    @Override
    public void deleteById(int id) {
        Scheduler scheduler = getById(id);
        schedulingStrategy.deleteJob(scheduler);
        schedulerRepository.delete(scheduler);
    }

    @Override
    public void deleteAllById(List<Integer> schedulerIds) {
        for (Integer id : schedulerIds) {
            try {
                deleteById(id);
            } catch (Exception ignored) {
            }
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
                .orElseThrow(() -> new SchedulerNotFoundException(id));
    }

    @Override
    public List<Scheduler> findAllById(ArrayList<Integer> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            return Collections.emptyList();
        }

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
        Connection connection = connectionService.getById(resource.getConnectionId());
        Scheduler scheduler = new Scheduler();
        scheduler.setId(resource.getSchedulerId());
        scheduler.setTitle(resource.getTitle());
        scheduler.setStatus(resource.isStatus());
        scheduler.setCronExp(resource.getCronExp());
        scheduler.setConnection(connection);
        scheduler.setDebugMode(resource.isDebugMode());

        List<NotificationResource> notificationResources = resource.getNotificationResources();
        List<EventNotification> eventNotificationList = new ArrayList<>();

        for (NotificationResource notificationResource : notificationResources) {
            eventNotificationList.add(toNotificationEntity(notificationResource));
        }
        scheduler.setEventNotifications(eventNotificationList);
        return scheduler;
    }

    @Override
    public SchedulerResource toResource(Scheduler entity) {
        return toResource(entity, true);
    }

    @Override
    public SchedulerResource toResource(Scheduler entity, Boolean includeConnection) {
        SchedulerResource schedulerResource = new SchedulerResource();
        schedulerResource.setSchedulerId(entity.getId());
        schedulerResource.setTitle(entity.getTitle());
        schedulerResource.setStatus(entity.getStatus());
        schedulerResource.setCronExp(entity.getCronExp());
        schedulerResource.setDebugMode(entity.getDebugMode());

        if (Boolean.TRUE.equals(includeConnection)) {
            schedulerResource.setConnection(connectionMapper.toDTO(entity.getConnection()));
        }

        if (entity.getLastExecution() != null) {
            schedulerResource.setLastExecution(lastExecutionService.toResource(entity.getLastExecution()));
        }
        if (entity.getWebhook() != null) {
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
    public synchronized void startNow(Scheduler scheduler) {
        throwIfConnectionIsBeingExecuted(scheduler.getConnection().getId());
        schedulingStrategy.runJob(scheduler);
    }

    @Override
    public void startNow(Scheduler scheduler, String channelId) {
        // Connections' duplicate execution has been checked in controller level
        schedulingStrategy.runJob(scheduler, channelId);
    }

    @Override
    public void startNow(Scheduler scheduler, Map<String, Object> webhook) {
        throwIfConnectionIsBeingExecuted(scheduler.getConnection().getId());
        schedulingStrategy.runJob(scheduler, webhook);
    }

    @Override
    public void startNow(Scheduler scheduler, List<MaskingRule> rules) {
        // Connections' duplicate execution has been checked in controller level
        schedulingStrategy.runJob(scheduler, rules);
    }

    @Override
    public void throwIfConnectionIsBeingExecuted(long connectionId) {
        boolean isBeingExecuted = schedulingStrategy.getRunningJobs().stream()
                .anyMatch(rj -> rj.connectionId() == connectionId);

        if (isBeingExecuted) {
            throw new ConcurrentTestIsForbidden(connectionId);
        }
    }

    @Override
    public Set<Long> getRunningConnectionIds() {
        return schedulingStrategy.getRunningJobs().stream()
                .map(RunningJob::connectionId)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public void saveEntity(Scheduler scheduler) {
        schedulerRepository.save(scheduler);
    }

    @Override
    public void disable(Scheduler scheduler) {
        schedulingStrategy.pauseJob(scheduler);
    }

    @Override
    public void enable(Scheduler scheduler) {
        schedulingStrategy.resumeJob(scheduler);
    }

    @Override
    public void terminate(Integer schedulerId) {
        Scheduler scheduler = getById(schedulerId);
        schedulingStrategy.terminate(scheduler);
    }

    @Override
    public List<RunningJobsResource> getAllRunningJobs() {
        return schedulingStrategy.getRunningJobs().stream()
                .map(this::toRunningJobResource)
                .toList();
    }

    @Override
    public List<RunningJobsResource> getAllRunningJobsExcludingOne(int schedulerId) {
        return schedulingStrategy.getRunningJobs().stream()
                .filter(runningJob -> runningJob.schedulerId() != schedulerId)
                .map(this::toRunningJobResource)
                .toList();
    }

    @Override
    public List<EventNotification> getAllNotifications(int schedulerId) {
        return notificationRepository.findBySchedulerId(schedulerId);
    }

    @Override
    public Optional<EventNotification> getNotification(int notificationId) {
        return notificationRepository.findById(notificationId);
    }

    @Override
    public EventNotification toNotificationEntity(NotificationResource resource) {
        EventNotification eventNotification = new EventNotification();
        eventNotification.setId(resource.getNotificationId());
        eventNotification.setName(resource.getName());
        eventNotification.setEventType(resource.getEventType());
        eventNotification.setScheduler(schedulerRepository.findById(resource.getSchedulerId()).orElseThrow(() ->
                new RuntimeException("Scheduler " + resource.getSchedulerId() + " not found")));

        Set<EventRecipient> notificationEventRecipients = resource.getRecipients().stream()
                .map(EventRecipient::new).collect(Collectors.toSet());

        eventNotification.setEventRecipients(notificationEventRecipients);
        eventNotification.setEventMessage(messageService.findById(resource.getTemplate().getTemplateId()).orElseThrow(() ->
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


    private RunningJobsResource toRunningJobResource(RunningJob runningJob) {
        long connectionId = runningJob.connectionId();
        int schedulerId = runningJob.schedulerId();
        long execId = runningJob.execId();

        RunningJobsResource resource = new RunningJobsResource();

        resource.setConnectionId(connectionId);
        resource.setSchedulerId(schedulerId);
        resource.setExecId(execId);
        resource.setTitle(getById(schedulerId).getTitle());
        resource.setStartTime(executionService.getById(execId).getStartTime());
        resource.setAvgDuration(executionService.getAvgDurationOfExecution(schedulerId));
        setConnectorTitles(resource, connectionService.getById(connectionId));

        return resource;
    }

    private void setConnectorTitles(RunningJobsResource resource, Connection connection) {
        if (!Objects.equals(connection.getFromConnector(), ConnectionConstants.DEFAULT_CONNECTOR_ID)) {
            Connector fromConnector = connectorService.getById(connection.getFromConnector());
            resource.setFromConnector(fromConnector.getTitle());
        }

        if (connection.getToConnector() != null) {
            Connector toConnector = connectorService.getById(connection.getToConnector());
            resource.setToConnector(toConnector.getTitle());
        }
    }
}
