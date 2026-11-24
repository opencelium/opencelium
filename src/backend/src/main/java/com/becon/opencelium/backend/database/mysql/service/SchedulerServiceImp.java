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
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.SchedulerNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.factory.SchedulerFactory;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.quartz.SchedulingStrategy;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJob;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import com.becon.opencelium.backend.utility.TestNameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(SchedulerServiceImp.class);

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
    private final ExecutionArgumentService executionArgumentService;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final GlobalVariableUsageService globalVariableUsageService;
    private final WorkflowRunGate runGate;


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
            ExecutionArgumentService executionArgumentService,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            GlobalVariableUsageService globalVariableUsageService,
            WorkflowRunGate runGate
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
        this.executionArgumentService = executionArgumentService;
        this.connectionMapper = connectionMapper;
        this.connectorService = connectorService;
        this.globalVariableUsageService = globalVariableUsageService;
        this.runGate = runGate;
    }

    @Override
    @Transactional(rollbackFor = {RuntimeException.class})
    public void save(@NonNull Scheduler scheduler) {
        // As requested by the UI team, the title in the scheduler will no longer be used.
//        if (existsByTitle(scheduler.getTitle())) {
//            throw new RuntimeException("TITLE_ALREADY_EXISTS");
//        }
        // a schedule sent with the id of a stored one is written over it, and the notifications of
        // that one then belong to the workflow sent here; a new schedule has none
        if (scheduler.getId() != 0) {
            schedulerRepository.findById(scheduler.getId())
                    .ifPresent(stored -> checkNotificationsIfWorkflowChanges(stored, scheduler.getConnection()));
        }

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

        // checked before the schedule is written or its job moved, so a refusal leaves both as they are
        checkNotificationsIfWorkflowChanges(entity, scheduler.getConnection());

        schedulerRepository.save(scheduler);
        schedulingStrategy.rescheduleJob(scheduler, oldCon);
        return scheduler;
    }

    @Override
    public List<Scheduler> saveAll(List<Scheduler> schedulers) {
        return schedulerRepository.saveAll(schedulers);
    }

    @Override
    @Transactional
    public void deleteById(int id) {
        Scheduler scheduler = getById(id);
        schedulingStrategy.deleteJob(scheduler);
        // Strip execution history explicitly: the execution/execution_argument FKs are
        // ON DELETE NO ACTION, and entity-level cascade misses rows written concurrently.
        executionArgumentService.deleteBySchedulerId(id);
        executionService.deleteBySchedulerId(id);
        // the notifications of a schedule are deleted with it, and so are their usages
        List<EventNotification> notifications = scheduler.getEventNotifications();
        schedulerRepository.delete(scheduler);
        if (notifications != null) {
            notifications.forEach(notification ->
                    globalVariableUsageService.deleteForNotification(notification.getId()));
        }
    }

    @Override
    public void deleteAllById(List<Integer> schedulerIds) {
        for (Integer id : schedulerIds) {
            try {
                deleteById(id);
            } catch (Exception e) {
                log.warn("Failed to delete scheduler {}", id, e);
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
    public List<Scheduler> excludeTestSchedulers(List<Scheduler> schedulers) {
        return schedulers.stream()
                .filter(s -> TestNameUtils.isNotTestScheduler(s.getTitle()))
                .toList();
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
        // Schedules and webhooks must be able to trigger multiple executions.
//        throwIfConnectionIsBeingExecuted(scheduler.getConnection().getId());
        throwIfRefusedByGlobalVariables(scheduler);
        schedulingStrategy.runJob(scheduler);
    }

    @Override
    public void startNow(Scheduler scheduler, String channelId) {
        // Connections' duplicate execution has been checked in controller level
        schedulingStrategy.runJob(scheduler, channelId);
    }

    /**
     * Starts a schedule for a webhook that carries no data. The run is the one a manual start
     * gives; only a refusal differs: the run gate counts it for the schedule, because the calling
     * system alone sees the answer.
     *
     * @throws GlobalVariableConflictException with code BUSY
     */
    @Override
    public synchronized void startNowByWebhook(Scheduler scheduler) {
        throwIfWebhookRefusedByGlobalVariables(scheduler);
        schedulingStrategy.runJob(scheduler);
    }

    /**
     * Starts a schedule for a webhook that carries data. Like a webhook without data, it does not
     * wait for other runs of the workflow; only the busy policy of a mutable global variable
     * can refuse it, and the run gate counts that refusal for the schedule.
     *
     * @throws GlobalVariableConflictException with code BUSY
     */
    @Override
    public void startNow(Scheduler scheduler, Map<String, Object> webhook) {
        throwIfWebhookRefusedByGlobalVariables(scheduler);
        schedulingStrategy.runJob(scheduler, webhook);
    }

    /**
     * Answers a start that a busy workflow would refuse at once, instead of only in the log of a
     * run that never begins. A start that would wait in the queue goes on to Quartz.
     *
     * @throws GlobalVariableConflictException with code BUSY
     */
    private void throwIfRefusedByGlobalVariables(Scheduler scheduler) {
        runGate.checkCanStart(scheduler.getConnection().getId());
    }

    /**
     * Answers a webhook start like {@link #throwIfRefusedByGlobalVariables}, and lets the run gate
     * count the refusal, which it reports once when the run that holds the workflow ends.
     *
     * @throws GlobalVariableConflictException with code BUSY
     */
    private void throwIfWebhookRefusedByGlobalVariables(Scheduler scheduler) {
        runGate.checkWebhookCanStart(scheduler.getConnection().getId(), scheduler.getId());
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
        // the texts a notification sends are those of its template: checked against the workflow
        // of its schedule before anything is stored
        globalVariableUsageService.checkNotification(eventNotification);

        notificationRepository.save(eventNotification);
        eventNotification.getEventRecipients().forEach(recipientService::save);
        messageService.save(eventNotification.getEventMessage());
        globalVariableUsageService.rebuildForNotification(eventNotification);
    }

    @Override
    public void deleteNotificationById(int id) {
        notificationRepository.deleteById(id);
        globalVariableUsageService.deleteForNotification(id);
    }


    /**
     * Checks the stored notifications of a schedule against the workflow it is given, when that
     * is another one than it runs now: a notification belongs to the workflow of its schedule, so
     * its texts must be in the scope of the new one. The notifications sent with the schedule are
     * not stored with it, so they are not the ones checked.
     *
     * @param stored   the schedule as it is stored, with its notifications
     * @param workflow the workflow it is given
     */
    private void checkNotificationsIfWorkflowChanges(Scheduler stored, Connection workflow) {
        Long current = stored.getConnection() == null ? null : stored.getConnection().getId();
        Long next = workflow == null ? null : workflow.getId();
        if (!Objects.equals(current, next)) {
            globalVariableUsageService.checkScheduleWorkflowChange(stored, workflow);
        }
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
