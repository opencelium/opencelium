package com.becon.opencelium.backend.execution.globalvariable;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.ScheduleData;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
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
import java.util.LinkedHashMap;
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
 * <p>A refused start, and a waiting one that is dropped, is logged, sent to the workflow's
 * websocket channel and handed to the {@link RefusalListener}, which records it as a failed
 * execution of its schedule. A start that a webhook asks for and that is refused on the call is
 * only counted then, because a busy workflow may be called many times: when the run ends, the
 * refused webhook starts of each schedule are reported once, with their number.
 *
 * <p>A schedule keeps at most one start that its cron trigger fired waiting. A further fire of it
 * is skipped: the waiting fire keeps its place and takes the time of the newer one, so the wait
 * limit counts from the schedule's latest fire, and the skipped fire is counted and reported like
 * a refused webhook start. Every other start that may wait is kept, as each webhook start carries
 * its own data and a user or a support file asked for the run.
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

    private volatile RefusalListener refusalListener = (schedule, connectionId, refusal) -> { };

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

    /** Hears of each start the gate refused or dropped from its queue. */
    @FunctionalInterface
    public interface RefusalListener {

        /**
         * Called after the refusal was logged and sent to the websocket channel.
         *
         * @param schedule     the schedule the start belongs to, with how it was started
         * @param connectionId id of the workflow
         * @param refusal      why the start did not run, with code BUSY
         */
        void refused(ScheduleData schedule, long connectionId, GlobalVariableConflictException refusal);
    }

    /**
     * Sets who hears of refused starts, replacing the one set before. A start whose schedule
     * cannot be found is only logged and sent to the websocket channel.
     */
    public void onRefusal(RefusalListener listener) {
        this.refusalListener = Objects.requireNonNull(listener, "listener");
    }

    /** What the gate decided about a start. */
    public enum Admission {
        /** The workflow uses no mutable variable: run, and do not call {@link #release}. */
        UNGATED,
        /** The start holds the workflow: run, and call {@link #release} when the run ends in any way. */
        HOLDS,
        /** The start waits in the queue and will be fired again: do not run it now. */
        QUEUED,
        /**
         * A cron fire whose schedule already has a cron fire waiting: do not run it. It is counted
         * and reported when the run that holds the workflow ends.
         */
        SKIPPED,
        /** The start was refused and reported: do not run it. */
        REFUSED;

        /** Whether the execution runs now. */
        public boolean runs() {
            return this == UNGATED || this == HOLDS;
        }
    }

    /**
     * Decides whether a start of a workflow runs now, waits or is refused. A refused start is
     * logged, sent to the workflow's websocket channel and handed to the {@link RefusalListener}.
     * A start that may wait is always kept; a start that a schedule's cron trigger fired goes to
     * {@link #admitCronFire} instead.
     *
     * @param connectionId id of the workflow
     * @param jobKey       the Quartz job the start belongs to, used to fire it again from the queue
     * @param triggerData  the data of the trigger that fired, carried over when it is fired again
     * @return the decision
     */
    public Admission admit(long connectionId, JobKey jobKey, JobDataMap triggerData) {
        return admit(connectionId, jobKey, triggerData, null);
    }

    /**
     * Decides about a start that the cron trigger of a schedule fired, like {@link #admit}, but
     * keeps at most one such start of the schedule waiting. While one waits, a further fire is
     * skipped: the waiting fire keeps its place in the queue and takes the time of the newer one,
     * and the skipped fire is counted for the schedule and reported once when the run that holds
     * the workflow ends. This comes before the queue's limit, so a full queue never refuses it.
     *
     * @param connectionId id of the workflow
     * @param scheduleId   id of the schedule whose cron trigger fired
     * @param jobKey       the Quartz job of the schedule
     * @param triggerData  the data of the cron trigger
     * @return the decision; {@link Admission#SKIPPED} for a fire that was skipped
     */
    public Admission admitCronFire(long connectionId, int scheduleId, JobKey jobKey, JobDataMap triggerData) {
        return admit(connectionId, jobKey, triggerData, scheduleId);
    }

    private Admission admit(long connectionId, JobKey jobKey, JobDataMap triggerData, Integer cronScheduleId) {
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
                lane.startedAt = clock.instant();
                return Admission.HOLDS;
            }

            Optional<Waiting> earlierFire = cronScheduleId == null
                    ? Optional.empty()
                    : waitingCronFireOf(lane, cronScheduleId);
            if (earlierFire.isPresent()) {
                // the wait limit counts from the schedule's latest fire
                replace(lane.waiting, earlierFire.get(), earlierFire.get().at(clock.instant()));
                count(lane, new Tally(cronScheduleId, Unrun.SKIPPED_CRON_FIRE),
                        new GlobalVariableConflictException(GlobalVariableConflictException.Code.BUSY,
                                "A cron fire of schedule %d already waits in the workflow's queue"
                                        .formatted(cronScheduleId),
                                0));
                admission = Admission.SKIPPED;
            } else {
                refusal = refusalOf(mutables, lane);
                if (refusal == null) {
                    lane.waiting.addLast(
                            new Waiting(jobKey, withoutTicket(triggerData), cronScheduleId, clock.instant()));
                    admission = Admission.QUEUED;
                } else {
                    admission = Admission.REFUSED;
                }
            }
            // nothing runs and nothing is reserved: the queue has to be started from here
            wakeQueue = wakeQueue || (!isBusy(lane) && !lane.waiting.isEmpty());
        }

        if (admission == Admission.QUEUED) {
            log.info("Workflow {} is busy: the start of job {} waits in its queue", connectionId, jobKey);
        } else if (admission == Admission.SKIPPED) {
            log.info("Workflow {} is busy: a cron fire of schedule {} already waits in its queue, so this fire"
                    + " of job {} is skipped", connectionId, cronScheduleId, jobKey);
        } else {
            refuse(connectionId, jobKey, triggerData, refusal);
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
        Long executionId;
        Map<Tally, Counted> unreported;
        synchronized (this) {
            Lane lane = lanes.get(connectionId);
            if (lane == null) {
                return;
            }
            executionId = lane.executionId;
            unreported = drainUnreported(lane);
            lane.running = false;
            lane.executionId = null;
            lane.startedAt = null;
        }
        // the queue moves on first: it does not wait for the report to be recorded
        startNext(connectionId);
        reportUnreported(connectionId, executionId, unreported);
    }

    /**
     * Refuses a start that is asked for by a user before it reaches Quartz, so the caller gets the
     * answer in the response. A start that would only wait is let through. The refusal is not
     * recorded: the user sees it.
     *
     * @param connectionId id of the workflow
     * @throws GlobalVariableConflictException with code BUSY if the workflow runs and the start
     *         would be refused
     */
    public void checkCanStart(long connectionId) {
        throwIfRefusedOnCall(connectionId, null);
    }

    /**
     * Refuses a start that is asked for by a webhook before it reaches Quartz, like {@link
     * #checkCanStart}, and counts the refusal for the webhook's schedule. Only the calling system
     * sees the answer, so when the run that holds the workflow ends, the refused webhook starts of
     * each schedule are sent to the workflow's websocket channel and handed to the {@link
     * RefusalListener} as one refusal that names how many there were.
     *
     * @param connectionId id of the workflow
     * @param scheduleId   id of the schedule the webhook belongs to
     * @throws GlobalVariableConflictException with code BUSY if the workflow runs and the start
     *         would be refused
     */
    public void checkWebhookCanStart(long connectionId, int scheduleId) {
        throwIfRefusedOnCall(connectionId, scheduleId);
    }

    private void throwIfRefusedOnCall(long connectionId, Integer webhookScheduleId) {
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
            if (refusal != null && webhookScheduleId != null) {
                count(lane, new Tally(webhookScheduleId, Unrun.REFUSED_WEBHOOK), refusal);
            }
        }
        if (refusal != null) {
            throw refusal;
        }
    }

    /**
     * The run that holds a workflow.
     *
     * @param workflowId  id of the workflow
     * @param executionId id of the running execution; {@code null} for the moment between the
     *                    start and the creation of its execution
     * @param startedAt   when the run took the workflow
     */
    public record Hold(long workflowId, Long executionId, Instant startedAt) {
    }

    /**
     * Returns the run that holds a workflow. A workflow that writes a mutable variable is held for
     * as long as one of its runs goes, so this tells whether the variable is being updated.
     *
     * @param connectionId id of the workflow
     * @return the hold; empty if no run holds the workflow
     */
    public synchronized Optional<Hold> holdOf(long connectionId) {
        Lane lane = lanes.get(connectionId);
        return lane == null || !lane.running
                ? Optional.empty()
                : Optional.of(new Hold(connectionId, lane.executionId, lane.startedAt));
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
            Map<Tally, Counted> unreported = Map.of();
            Waiting next;
            String ticket = null;
            synchronized (this) {
                Lane lane = lanes.get(connectionId);
                if (lane == null || isBusy(lane)) {
                    return;
                }
                next = pollUnexpired(lane, expired);
                if (next == null) {
                    // counted while the workflow was reserved for a start that never arrived
                    unreported = drainUnreported(lane);
                    lanes.remove(connectionId);
                } else {
                    ticket = UUID.randomUUID().toString();
                    lane.reservation = new Reservation(ticket, clock.instant());
                }
            }

            reportUnreported(connectionId, null, unreported);
            for (Waiting waiting : expired) {
                GlobalVariableConflictException dropped = new GlobalVariableConflictException(
                        GlobalVariableConflictException.Code.BUSY,
                        "The start of job %s waited longer than %d minutes for the running execution and was dropped"
                                .formatted(waiting.jobKey(), maxWait.toMinutes()),
                        0);
                refuse(connectionId, waiting.jobKey(), waiting.triggerData(), dropped);
            }
            if (next == null) {
                return;
            }

            try {
                fire(next, ticket);
                return;
            } catch (SchedulerException | RuntimeException e) {
                log.error("Workflow {}: the waiting start of job {} could not be fired", connectionId, next.jobKey(), e);
                GlobalVariableConflictException unfired = new GlobalVariableConflictException(
                        GlobalVariableConflictException.Code.BUSY,
                        "The waiting start of job %s could not be fired: %s".formatted(next.jobKey(), e.getMessage()),
                        0);
                refuse(connectionId, next.jobKey(), next.triggerData(), unfired);
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

    private void refuse(long connectionId, JobKey jobKey, JobDataMap triggerData,
            GlobalVariableConflictException refusal) {
        report(connectionId, refusal);

        Optional<ScheduleData> schedule = scheduleOf(jobKey, triggerData);
        if (schedule.isEmpty()) {
            log.warn("Workflow {}: the refused start of job {} names no schedule, so no execution records it",
                    connectionId, jobKey);
            return;
        }
        handToListener(connectionId, schedule.get(), refusal);
    }

    /**
     * Reports the starts that were counted instead of reported one by one, the webhook starts
     * refused on the call and the cron fires skipped: for each schedule and kind one refusal,
     * which names how many starts there were and why the first of them did not run.
     *
     * @param executionId the execution that held the workflow; {@code null} if it is not known
     */
    private void reportUnreported(long connectionId, Long executionId, Map<Tally, Counted> unreported) {
        String busyWhile = executionId == null
                ? "the workflow was busy"
                : "execution " + executionId + " of the workflow ran";
        unreported.forEach((tally, starts) -> {
            Unrun kind = tally.kind();
            GlobalVariableConflictException summary = new GlobalVariableConflictException(
                    GlobalVariableConflictException.Code.BUSY,
                    "%s of schedule %d %s while %s: %d. The first one was %s with: %s".formatted(
                            kind.starts, tally.scheduleId(), kind.outcome, busyWhile, starts.count(),
                            kind.outcome, starts.first().getMessage()),
                    starts.first().getCurrentVersion());
            report(connectionId, summary);
            handToListener(connectionId, new ScheduleData(tally.scheduleId(), kind.triggerType), summary);
        });
    }

    /** Logs a refusal and sends it to the workflow's websocket channel. */
    private void report(long connectionId, GlobalVariableConflictException refusal) {
        log.warn("Workflow {}: a start was refused. {}", connectionId, refusal.getMessage());
        try {
            notifications.send(connectionId, new ErrorResource(refusal, HttpStatus.CONFLICT));
        } catch (RuntimeException e) {
            log.warn("Workflow {}: the refusal could not be sent to the websocket channel", connectionId, e);
        }
    }

    /** Hands a refusal to the listener; a listener that fails changes nothing for the caller. */
    private void handToListener(long connectionId, ScheduleData schedule, GlobalVariableConflictException refusal) {
        try {
            refusalListener.refused(schedule, connectionId, refusal);
        } catch (RuntimeException e) {
            log.warn("Workflow {}: the refused start of schedule {} could not be recorded",
                    connectionId, schedule.getScheduleId(), e);
        }
    }

    /** Counts a start that does not run, to be reported when the run that holds the workflow ends. */
    private static void count(Lane lane, Tally tally, GlobalVariableConflictException reason) {
        lane.unreported.merge(tally, new Counted(reason, 1), (counted, one) -> counted.andOneMore());
    }

    /** Takes the starts counted for a workflow, leaving none behind. */
    private static Map<Tally, Counted> drainUnreported(Lane lane) {
        if (lane.unreported.isEmpty()) {
            return Map.of();
        }
        Map<Tally, Counted> drained = new LinkedHashMap<>(lane.unreported);
        lane.unreported.clear();
        return drained;
    }

    /** Returns the start that the cron trigger of a schedule fired and that waits, if one does. */
    private static Optional<Waiting> waitingCronFireOf(Lane lane, int scheduleId) {
        return lane.waiting.stream().filter(waiting -> waiting.isCronFireOf(scheduleId)).findFirst();
    }

    /** Puts {@code updated} in the place of {@code old}, leaving the order of the queue as it was. */
    private static void replace(Deque<Waiting> queue, Waiting old, Waiting updated) {
        // a deque cannot set an element: turn it once around, swapping the one on the way
        for (int left = queue.size(); left > 0; left--) {
            Waiting next = queue.pollFirst();
            queue.addLast(next == old ? updated : next);
        }
    }

    /**
     * Finds the schedule a start belongs to the way {@code JobExecutor} does: the data of the
     * trigger that fired, else the data of its job, else the bare schedule id of an old job.
     */
    private Optional<ScheduleData> scheduleOf(JobKey jobKey, JobDataMap triggerData) {
        if (triggerData != null && triggerData.get("data") instanceof ScheduleData data) {
            return Optional.of(data);
        }
        try {
            JobDetail job = quartzScheduler.getJobDetail(jobKey);
            if (job == null) {
                return Optional.empty();
            }
            JobDataMap jobData = job.getJobDataMap();
            if (jobData.get("data") instanceof ScheduleData data) {
                return Optional.of(data);
            }
            return jobData.containsKey("schedulerId")
                    ? Optional.of(new ScheduleData(jobData.getIntValue("schedulerId"), TriggerType.SCHEDULER))
                    : Optional.empty();
        } catch (SchedulerException e) {
            log.warn("The job {} of a refused start could not be read", jobKey, e);
            return Optional.empty();
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
        private Instant startedAt;
        private Reservation reservation;
        private final Deque<Waiting> waiting = new ArrayDeque<>();
        // starts that did not run and are not reported yet, by schedule and kind
        private final Map<Tally, Counted> unreported = new LinkedHashMap<>();
    }

    /**
     * A start that waits in the queue.
     *
     * @param cronScheduleId the schedule whose cron trigger fired the start; {@code null} for a
     *                       start that is kept however often it comes
     * @param since          when the start began to wait, or for a cron fire, when its schedule
     *                       last fired
     */
    private record Waiting(JobKey jobKey, JobDataMap triggerData, Integer cronScheduleId, Instant since) {

        boolean isCronFireOf(int scheduleId) {
            return cronScheduleId != null && cronScheduleId == scheduleId;
        }

        Waiting at(Instant firedAt) {
            return new Waiting(jobKey, triggerData, cronScheduleId, firedAt);
        }
    }

    /**
     * The starts of one schedule that did not run for the same reason and are reported together.
     *
     * @param scheduleId id of the schedule
     * @param kind       why they did not run
     */
    private record Tally(int scheduleId, Unrun kind) {
    }

    /** Why counted starts did not run, and how their report names them. */
    private enum Unrun {
        /** Webhook starts refused on the call. */
        REFUSED_WEBHOOK(TriggerType.WEBHOOK, "Webhook starts", "refused"),
        /** Cron fires skipped because an earlier fire of their schedule waited. */
        SKIPPED_CRON_FIRE(TriggerType.SCHEDULER, "Cron fires", "skipped");

        private final TriggerType triggerType;
        private final String starts;
        private final String outcome;

        Unrun(TriggerType triggerType, String starts, String outcome) {
            this.triggerType = triggerType;
            this.starts = starts;
            this.outcome = outcome;
        }
    }

    /**
     * The starts counted under one {@link Tally}.
     *
     * @param first why the first of them did not run
     * @param count how many there were
     */
    private record Counted(GlobalVariableConflictException first, int count) {

        Counted andOneMore() {
            return new Counted(first, count + 1);
        }
    }

    private record Reservation(String ticket, Instant since) {
    }
}
