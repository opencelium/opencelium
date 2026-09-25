package com.becon.opencelium.backend.websocket;

import com.becon.opencelium.backend.database.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.websocket.constant.SocketConstant;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RunningJobsBroadcaster {

    private final SchedulerServiceImp schedulerService;
    private final WebSocketNotificationService notificationService;

    public RunningJobsBroadcaster(
            SchedulerServiceImp schedulerService,
            WebSocketNotificationService notificationService
    ) {
        this.schedulerService = schedulerService;
        this.notificationService = notificationService;
    }

    public void broadcast() {
        List<RunningJobsResource> allRunningJobs = schedulerService.getAllRunningJobs();
        notificationService.send(SocketConstant.SCHEDULER_DESTINATION, allRunningJobs);
    }
}
