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

import com.becon.opencelium.backend.mysql.entity.*;
import com.becon.opencelium.backend.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.quartz.QuartzUtility;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.quartz.SchedulerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SchedulerServiceImp implements SchedulerService {

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private SchedulerRepository schedulerRepository;

    @Autowired
    private QuartzUtility quartzUtility;

    @Autowired
    private WebhookServiceImp webhookService;

    @Autowired
    private ExecutionServiceImp executionServiceImp;

    @Autowired
    private LastExecutionServiceImp lastExecutionServiceImp;

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RecipientServiceImpl recipientService;

    @Autowired
    private MessageServiceImpl messageService;

    @Override
    public void save(Scheduler scheduler) {
        if(quartzUtility.validateCronExpression(scheduler.getCronExp())) {
            schedulerRepository.save(scheduler);
        }
        else{
            throw new RuntimeException("BAD_CRON_EXPRESSION");
        }

        try {
            quartzUtility.addJob(scheduler);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Scheduler> saveAll(List<Scheduler> schedulers) {
        return schedulerRepository.saveAll(schedulers);
    }

    @Override
    public void deleteById(int id) {
        Scheduler scheduler = schedulerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheduler not found"));
        try {
            quartzUtility.deleteJob(scheduler);
        } catch (Exception e){
            throw new RuntimeException(e);
        }

//        lastExecutionServiceImp.deleteAllBySchedulerId(scheduler.getId());
//        executionServiceImp.deleteAllBySchedulerId(scheduler.getId());
        schedulerRepository.deleteById(id);
    }

    @Override
    public void deleteAllById(List<Integer> schedulerIds) {
        List<Scheduler> schedulerList = schedulerRepository.findAllById(schedulerIds);

        schedulerList.forEach(scheduler -> {
            try{
                quartzUtility.deleteJob(scheduler);
            }catch (Exception e){
                throw new RuntimeException(e);
            }
//            lastExecutionServiceImp.deleteAllBySchedulerId(scheduler.getId());
//            executionServiceImp.deleteAllBySchedulerId(scheduler.getId());
            schedulerRepository.deleteById(scheduler.getId());
        });
    }

    @Override
    public List<Scheduler> findAll() {
        return schedulerRepository.findAll();
    }

    @Override
    public Optional<Scheduler> findById(int id) {
        return schedulerRepository.findById(id);
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
        schedulerResource.setConnection(connectionService.toResource(entity.getConnection()));

        if (entity.getLastExecution() != null){
            schedulerResource.setLastExecution(lastExecutionServiceImp.toResource(entity.getLastExecution()));
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
        quartzUtility.runJob(scheduler);
    }

    @Override
    public void saveEntity(Scheduler scheduler) {
        schedulerRepository.save(scheduler);
    }

    @Override
    public void disable(Scheduler scheduler) throws SchedulerException{
        quartzUtility.pauseTrigger(scheduler);
    }

    @Override
    public void enable(Scheduler scheduler) throws SchedulerException {
        quartzUtility.resumeTrigger(scheduler);
    }

    @Override
    public List<RunningJobsResource> getAllRunningJobs() throws Exception{
        RunningJobsResource runningJobResource = new RunningJobsResource();
        List<RunningJobsResource> runningJobResources = new ArrayList<>();
        // <schedulerId, connectionId>
        Map<Integer, Long> mappedData = quartzUtility.getRunningJobsData();

        if (mappedData == null){
            return null;
        }
        mappedData.forEach((schedulerId, connectionId) -> {
            Connection connection = connectionService.findById(connectionId)
                    .orElseThrow(() -> new RuntimeException("Connection not found"));
            Scheduler scheduler = schedulerRepository.findById(schedulerId)
                    .orElseThrow(() -> new RuntimeException("Scheduler not found"));

            String from = connectorService.findById( connection.getFromConnector()).get().getInvoker();
            String to = connectorService.findById( connection.getToConnector()).get().getInvoker();

            // TODO: need to rework calculation of avg time
            double avg = executionServiceImp.getAvgDurationOfExecution(schedulerId);

            runningJobResource.setSchedulerId(scheduler.getId());
            runningJobResource.setTitle(scheduler.getTitle());
            runningJobResource.setFromConnector(from);
            runningJobResource.setToConnector(to);
            runningJobResource.setAvgDuration(avg);
            runningJobResources.add(runningJobResource);
        });
        return runningJobResources;
    }

    @Override
    public List<NotificationResource> getAllNotifications(int schedulerId){

        List<NotificationResource> notificationResources  = new ArrayList<>();

        notificationRepository.findBySchedulerId(schedulerId).forEach(notification -> notificationResources.add(new NotificationResource(notification)));

        return notificationResources;
    }

    @Override
    public NotificationResource getNotification(int notificationId){
        NotificationResource notificationResource = new NotificationResource( notificationRepository.findById(notificationId).orElseThrow(()->new RuntimeException("Notification not found")));

        return notificationResource;
    }

    @Override
    public EventNotification toNotificationEntity(NotificationResource resource) {
        EventNotification eventNotification = new EventNotification();
        eventNotification.setId(resource.getNotificationId());
        eventNotification.setName(resource.getName());
        eventNotification.setEventType(resource.getEventType());
        eventNotification.setScheduler(schedulerRepository.findById(resource.getSchedulerId()).orElseThrow(()->new RuntimeException("Scheduler "+resource.getSchedulerId()+" not found")));

        //TODO: need to check
        List<EventRecipient> notificationEventRecipients = new ArrayList<>();
        notificationEventRecipients = resource.getRecipients().stream()
                .map(EventRecipient::new).
                        collect(Collectors.toList());

        eventNotification.setEventRecipients(notificationEventRecipients);
        eventNotification.setEventMessage(messageService.toEntity(resource.getTemplate()));
        return eventNotification;
    }

    @Override
    public NotificationResource toNotificationResource(EventNotification eventNotification) {
        return new NotificationResource(eventNotification);
    }

    @Override
    public void saveNotification(EventNotification eventNotification) {

        notificationRepository.save(eventNotification);
        eventNotification.getEventRecipients().forEach(notificationRecipient -> recipientService.save(notificationRecipient));
        messageService.save(eventNotification.getEventMessage());
    }

    @Override
    public void deleteNotificationById(int id) {
        notificationRepository.deleteById(id);
    }


}
