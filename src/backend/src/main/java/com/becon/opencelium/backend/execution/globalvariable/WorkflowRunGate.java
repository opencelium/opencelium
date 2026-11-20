package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import org.quartz.JobDataMap;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Lets a workflow that uses a mutable global variable run one execution at a time.
 *
 * <p>While an execution of such a workflow runs, the workflow is busy, and a second start follows
 * the busy policy of its mutable variables: with {@link GlobalVariableBusyPolicy#QUEUE} it waits in
 * a first-in, first-out queue of the workflow, and with {@link GlobalVariableBusyPolicy#REFUSE} it
 * does not start. One variable that says Refuse is enough to refuse. Two different workflows never
 * wait for each other: only the owner workflow writes a mutable variable, the others read it.
 *
 * <p>A waiting start does not keep a Quartz thread. Its job key and trigger data are parked here,
 * and when the running execution ends, the oldest one is fired again as a one-shot trigger. The
 * workflow stays reserved for that trigger, which carries {@link #TICKET_KEY}, so a start that
 * comes in between cannot overtake it. A queued start is checked and snapshotted when it leaves the
 * queue, because it only then reaches the execution.
 *
 * <p>The state is kept in memory. A crash or restart frees every workflow, and the starts that were
 * waiting are lost; a schedule fires again at its next time.
 */
@Component
public class WorkflowRunGate {

    /** Trigger data key of the ticket that a start fired from the queue carries. */
    public static final String TICKET_KEY = "globalVariableQueueTicket";

    /**
     * How long the workflow stays reserved for a start fired from the queue. If its trigger has
     * not arrived by then, e.g. because its schedule was deleted, the reservation is dropped so
     * the queue does not stand still.
     */
    static final Duration RESERVATION_TIMEOUT = Duration.ofMinutes(10);

    private static final Logger log = LoggerFactory.getLogger(WorkflowRunGate.class);

    private final GlobalVariableRepository repository;
    private final Scheduler quartzScheduler;
    private final WebSocketNotificationService notifications;
    private final int maxWaiting;
    private final Duration maxWait;
    private final Clock clock;

    // guarded by this; a workflow has an entry only while it runs, is reserved or has waiting starts
    private final Map<Long, Lane> lanes = new HashMap<>();

    @Autowired
    public WorkflowRunGate(
            GlobalVariableRepository repository,
            Scheduler quartzScheduler,
            WebSocketNotificationService notifications,
            @Value("${opencelium.global-variable.queue.max-waiting:100}") int maxWaiting,
            @Value("${opencelium.global-variable.queue.max-wait-minutes:60}") long maxWaitMinutes) {
        this(repository, quartzScheduler, notifications, maxWaiting, Duration.ofMinutes(maxWaitMinutes),
                Clock.systemUTC());
    }

    /**
     * Creates a gate with its own clock, which decides how long a start has waited.
     *
     * @param maxWaiting how many starts may wait per workflow
     * @param maxWait    how long a start may wait before it is dropped
     */
    public WorkflowRunGate(GlobalVariableRepository repository, Scheduler quartzScheduler,
            WebSocketNotificationService notifications, int maxWaiting, Duration maxWait, Clock clock) {
        this.repository = Objects.requireNonNull(repository, "repository");
        this.quartzScheduler = Objects.requireNonNull(quartzScheduler, "quartzScheduler");
        this.notifications = Objects.requireNonNull(notifications, "notifications");
        this.maxWaiting = maxWaiting;
        this.maxWait = Objects.requireNonNull(maxWait, "maxWait");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    /** What the gate decided about a start. */
    public enum Admission {
        /** The workflow uses no mutable variable: run, and do not call {@link #release}. */
        UNGATED,
        /** The start holds the workflow: run, and call {@link #release} when the run ends in any way. */
        HOLDS,
        /** The start waits in the queue and will be fired again: do not run it now. */
        QUEUED,
        /** The start was refused and reported: do not run it. */
        REFUSED;

        /** Whether the execution runs now. */
        public boolean runs() {
            return this == UNGATED || this == HOLDS;
        }
    }

    /**
     * Decides whether a start of a workflow runs now, waits or is refused. A refused start is
     * logged and sent to the workflow's websocket channel.
     *
     * @param connectionId id of the workflow
     * @param jobKey       the Quartz job the start belongs to, used to fire it again from the queue
     * @param triggerData  the data of the trigger that fired, carried over when it is fired again
     * @return the decision
     */
    public Admission admit(long connectionId, JobKey jobKey, JobDataMap triggerData) {
        String ticket = triggerData == null ? null : triggerData.getString(TICKET_KEY);
        List<GlobalVariable> mutables = repository.findMutableUsedByWorkflow(connectionId);
        // a ticket is honoured even when the variables are gone, so its reservation is released
        if (mutables.isEmpty() && ticket == null) {
            return Admission.UNGATED;
        }

        GlobalVariableConflictException refusal = null;
        boolean wakeQueue = false;
        Admission admission;
        synchronized (this) {
            Lane lane = lanes.computeIfAbsent(connectionId, id -> new Lane());
            wakeQueue = dropStaleReservation(connectionId, lane);
            boolean reservedForThis = lane.reservation != null && lane.reservation.ticket().equals(ticket);
            // a new start may not overtake the ones that already wait
            if (!lane.running && (reservedForThis || (lane.reservation == null && lane.waiting.isEmpty()))) {
                lane.running = true;
                lane.reservation = null;
                lane.executionId = null;
                return Admission.HOLDS;
            }

            refusal = refusalOf(mutables, lane);
            if (refusal == null) {
                lane.waiting.addLast(new Waiting(jobKey, withoutTicket(triggerData), clock.instant()));
                admission = Admission.QUEUED;
            } else {
                admission = Admission.REFUSED;
            }
            // nothing runs and nothing is reserved: the queue has to be started from here
            wakeQueue = wakeQueue || (!isBusy(lane) && !lane.waiting.isEmpty());
        }

        if (admission == Admission.QUEUED) {
            log.info("Workflow {} is busy: the start of job {} waits in its queue", connectionId, jobKey);
        } else {
            refuse(connectionId, refusal);
        }
        if (wakeQueue) {
            startNext(connectionId);
        }
        return admission;
    }

    /**
     * Records which execution holds the workflow, so a refusal can name it.
     *
     * @param connectionId id of the workflow
     * @param executionId  id of the running execution
     */
    public synchronized void recordExecution(long connectionId, long executionId) {
        Lane lane = lanes.get(connectionId);
        if (lane != null && lane.running) {
            lane.executionId = executionId;
        }
    }

    /**
     * Frees a workflow after a run that {@link #admit} let hold it ended, whether it succeeded,
     * failed, was terminated or timed out, and fires the oldest waiting start.
     *
     * @param connectionId id of the workflow
     */
    public void release(long connectionId) {
        synchronized (this) {
            Lane lane = lanes.get(connectionId);
            if (lane == null) {
                return;
            }
            lane.running = false;
            lane.executionId = null;
        }
        startNext(connectionId);
    }

    /**
     * Refuses a start that is asked for by a user or a webhook before it reaches Quartz, so the
     * caller gets the answer in the response. A start that would only wait is let through.
     *
     * @param connectionId id of the workflow
     * @throws GlobalVariableConflictException with code BUSY if the workflow runs and the start
     *         would be refused
     */
    public void checkCanStart(long connectionId) {
        List<GlobalVariable> mutables = repository.findMutableUsedByWorkflow(connectionId);
        if (mutables.isEmpty()) {
            return;
        }
        GlobalVariableConflictException refusal;
        synchronized (this) {
            Lane lane = lanes.get(connectionId);
            if (lane == null || !isBusy(lane)) {
                return;
            }
            refusal = refusalOf(mutables, lane);
        }
        if (refusal != null) {
            throw refusal;
        }
    }

    /**
     * Returns the execution that holds a workflow.
     *
     * @param connectionId id of the workflow
     * @return the id of the running execution; empty if the workflow is free or its execution has
     *         no id yet
     */
    public synchronized Optional<Long> runningExecutionOf(long connectionId) {
        Lane lane = lanes.get(connectionId);
        return lane == null || !lane.running ? Optional.empty() : Optional.ofNullable(lane.executionId);
    }

    /**
     * Returns how many starts of a workflow wait in its queue.
     *
     * @param connectionId id of the workflow
     */
    public synchronized int waitingCount(long connectionId) {
        Lane lane = lanes.get(connectionId);
        return lane == null ? 0 : lane.waiting.size();
    }

    private void startNext(long connectionId) {
        while (true) {
            List<Waiting> expired = new ArrayList<>();
            Waiting next;
            String ticket = null;
            synchronized (this) {
                Lane lane = lanes.get(connectionId);
                if (lane == null || isBusy(lane)) {
                    return;
                }
                next = pollUnexpired(lane, expired);
                if (next == null) {
                    lanes.remove(connectionId);
                } else {
                    ticket = UUID.randomUUID().toString();
                    lane.reservation = new Reservation(ticket, clock.instant());
                }
            }

            for (Waiting waiting : expired) {
                refuse(connectionId, new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                        "The start of job %s waited longer than %d minutes for the running execution and was dropped"
                                .formatted(waiting.jobKey(), maxWait.toMinutes()),
                        0));
            }
            if (next == null) {
                return;
            }

            try {
                fire(next, ticket);
                return;
            } catch (SchedulerException | RuntimeException e) {
                log.error("Workflow {}: the waiting start of job {} could not be fired", connectionId, next.jobKey(), e);
                refuse(connectionId, new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                        "The waiting start of job %s could not be fired: %s".formatted(next.jobKey(), e.getMessage()),
                        0));
                synchronized (this) {
                    Lane lane = lanes.get(connectionId);
                    if (lane != null && lane.reservation != null && lane.reservation.ticket().equals(ticket)) {
                        lane.reservation = null;
                    }
                }
            }
        }
    }

    private void fire(Waiting waiting, String ticket) throws SchedulerException {
        JobDataMap data = new JobDataMap(waiting.triggerData());
        data.put(TICKET_KEY, ticket);
        Trigger trigger = TriggerBuilder.newTrigger()
                .forJob(waiting.jobKey())
                .usingJobData(data)
                .startNow()
                .build();
        quartzScheduler.scheduleJob(trigger);
    }

    private Waiting pollUnexpired(Lane lane, List<Waiting> expired) {
        Instant oldestAllowed = clock.instant().minus(maxWait);
        Waiting next = lane.waiting.pollFirst();
        while (next != null && next.since().isBefore(oldestAllowed)) {
            expired.add(next);
            next = lane.waiting.pollFirst();
        }
        return next;
    }

    /** Drops a reservation whose trigger did not arrive in time; tells whether the queue may move on. */
    private boolean dropStaleReservation(long connectionId, Lane lane) {
        if (lane.reservation == null
                || lane.reservation.since().plus(RESERVATION_TIMEOUT).isAfter(clock.instant())) {
            return false;
        }
        log.warn("Workflow {}: the start fired from the queue did not arrive within {}, its reservation is dropped",
                connectionId, RESERVATION_TIMEOUT);
        lane.reservation = null;
        return !lane.running;
    }

    private boolean isBusy(Lane lane) {
        return lane.running || (lane.reservation != null
                && lane.reservation.since().plus(RESERVATION_TIMEOUT).isAfter(clock.instant()));
    }

    /** Returns why a start of a busy workflow is refused, or {@code null} if it may wait. */
    private GlobalVariableConflictException refusalOf(List<GlobalVariable> mutables, Lane lane) {
        String holder = lane.executionId == null
                ? "an execution of the workflow is running"
                : "execution " + lane.executionId + " of the workflow is running";
        for (GlobalVariable variable : mutables) {
            if (variable.getBusyPolicy() == GlobalVariableBusyPolicy.REFUSE) {
                return new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                        "Global variable '%s' is busy: %s and its busy policy is REFUSE"
                                .formatted(variable.getName(), holder),
                        variable.getVersion());
            }
        }
        if (lane.waiting.size() >= maxWaiting) {
            return new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                    "The workflow is busy: %s and %d starts already wait in its queue".formatted(holder, maxWaiting),
                    0);
        }
        return null;
    }

    private void refuse(long connectionId, GlobalVariableConflictException refusal) {
        log.warn("Workflow {}: a start was refused. {}", connectionId, refusal.getMessage());
        try {
            notifications.send(connectionId, new ErrorResource(refusal, HttpStatus.CONFLICT));
        } catch (RuntimeException e) {
            log.warn("Workflow {}: the refusal could not be sent to the websocket channel", connectionId, e);
        }
    }

    private static JobDataMap withoutTicket(JobDataMap triggerData) {
        JobDataMap copy = triggerData == null ? new JobDataMap() : new JobDataMap(triggerData);
        copy.remove(TICKET_KEY);
        return copy;
    }

    private static final class Lane {
        private boolean running;
        private Long executionId;
        private Reservation reservation;
        private final Deque<Waiting> waiting = new ArrayDeque<>();
    }

    private record Waiting(JobKey jobKey, JobDataMap triggerData, Instant since) {
    }

    private record Reservation(String ticket, Instant since) {
    }
}
