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

package com.becon.opencelium.backend.aspect;

import com.becon.opencelium.backend.application.language.LanguageService;
import com.becon.opencelium.backend.constant.AggrConst;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.LogConstant;
import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.EventRecipient;
import com.becon.opencelium.backend.database.mysql.entity.Execution;
import com.becon.opencelium.backend.database.mysql.entity.ExecutionArgument;
import com.becon.opencelium.backend.database.mysql.entity.LastExecution;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.DataAggregatorService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionService;
import com.becon.opencelium.backend.database.mysql.service.LastExecutionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.database.mysql.service.SubscriptionService;
import com.becon.opencelium.backend.database.mysql.service.UserService;
import com.becon.opencelium.backend.exception.ExecutionTerminatedException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.execution.JSHttpObject;
import com.becon.opencelium.backend.execution.globalvariable.GlobalTextRenderer;
import com.becon.opencelium.backend.execution.globalvariable.GlobalValueCaster;
import com.becon.opencelium.backend.execution.globalvariable.GlobalValueResolver;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.pubsub.ExecutionEventPublisher;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionFinishedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionStartedEvent;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.execution.notification.IncomingWebhookService;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotService;
import com.becon.opencelium.backend.utility.EmailUtility;
import com.becon.opencelium.backend.websocket.constant.SocketConstant;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import com.becon.opencelium.backend.quartz.JobExecutor;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.quartz.CronTrigger;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.constant.LogConstant.FAIL;
import static com.becon.opencelium.backend.constant.LogConstant.SUCCESS;
import static com.becon.opencelium.backend.constant.LogConstant.TERMINATED;

@Aspect
@Component
public class ExecutionAspect {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);
    private final SchedulerService schedulerService;
    private final UserService userService;
    private final IncomingWebhookService incomingWebhookService;
    private final ExecutionService executionService;
    private final EmailServiceImpl emailService;
    private final Environment env;
    private final LastExecutionService lastExecutionService;
    private final DataAggregatorService dataAggregatorService;
    private final SubscriptionService subscriptionService;
    private final WebSocketNotificationService notificationService;
    private final ConnectionService connectionService;
    private final LanguageService languageService;
    private final GlobalVariableSnapshotService globalVariableSnapshotService;
    private final WorkflowRunGate runGate;

    public ExecutionAspect(
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("userServiceImpl") UserService userService,
            @Qualifier("executionServiceImp") ExecutionService executionService,
            @Qualifier("lastExecutionServiceImp") LastExecutionService lastExecutionService,
            @Qualifier("subscriptionServiceImpl") SubscriptionService subscriptionService,
            @Qualifier("dataAggregatorServiceImp") DataAggregatorService dataAggregatorService,
            IncomingWebhookService incomingWebhookService,
            EmailServiceImpl emailService,
            Environment env,
            WebSocketNotificationService notificationService,
            ConnectionService connectionService,
            LanguageService languageService,
            GlobalVariableSnapshotService globalVariableSnapshotService,
            WorkflowRunGate runGate) {
        this.schedulerService = schedulerService;
        this.userService = userService;
        this.incomingWebhookService = incomingWebhookService;
        this.executionService = executionService;
        this.emailService = emailService;
        this.env = env;
        this.lastExecutionService = lastExecutionService;
        this.dataAggregatorService = dataAggregatorService;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
        this.connectionService = connectionService;
        this.languageService = languageService;
        this.globalVariableSnapshotService = globalVariableSnapshotService;
        this.runGate = runGate;
    }

    /**
     * Lets a workflow that uses a mutable global variable run one execution at a time; see
     * {@link WorkflowRunGate}. Within this aspect an {@code @Around} advice wraps the
     * {@code @Before} and {@code @After...} ones, so a start that waits or is refused never reaches
     * them: it sends no notification, and the workflow is freed only after the end of the run has
     * been recorded. A refused start is recorded apart, by {@link #recordRefusedStart}. A start
     * that its schedule's cron trigger fired is handed to the gate as such, so a schedule keeps
     * at most one of them waiting.
     */
    @Around("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public Object gateByMutableVariables(ProceedingJoinPoint joinPoint, JobExecutionContext context) throws Throwable {
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        // a test run writes only its own copy of the values, so it never waits for a real run
        if (data != null && data.getExecType() == QuartzJobScheduler.TriggerType.EXECUTION_TEST) {
            return joinPoint.proceed();
        }

        int schedulerId = data != null ? data.getScheduleId() : jobDataMap.getIntValue("schedulerId");
        long connectionId = schedulerService.getById(schedulerId).getConnection().getId();
        JobKey jobKey = context.getJobDetail().getKey();
        JobDataMap triggerData = context.getTrigger().getJobDataMap();
        // only a schedule's own trigger is a cron trigger; a manual, webhook or support-file start,
        // and a start fired again from the queue, come by a trigger that fires once
        WorkflowRunGate.Admission admission = context.getTrigger() instanceof CronTrigger
                ? runGate.admitCronFire(connectionId, schedulerId, jobKey, triggerData)
                : runGate.admit(connectionId, jobKey, triggerData);
        if (!admission.runs()) {
            return null;
        }
        if (admission == WorkflowRunGate.Admission.UNGATED) {
            return joinPoint.proceed();
        }
        try {
            return joinPoint.proceed();
        } finally {
            runGate.release(connectionId);
        }
    }

    @Before("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendBefore(JobExecutionContext context) {
        Subscription activSub = subscriptionService.getActiveSubs();
        if (!subscriptionService.isValid(activSub)) {
            logger.warn("Subscription is not valid");
            return;
        }

        JobDataMap jobDataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data != null ? data.getScheduleId() : jobDataMap.getIntValue("schedulerId");
        long execId = initExecutionObj(schedulerId);
        Scheduler scheduler = schedulerService.getById(schedulerId);
        long connectionId = scheduler.getConnection().getId();
        String timestamp = LocalDateTime.now().format(LogConstant.DATE_TIME_FORMATTER);
        // lets a start refused while this run goes name the execution that holds the workflow
        runGate.recordExecution(connectionId, execId);

        // save required data on job execution context
        jobDataMap.put("execId", execId);
        jobDataMap.put("connectionId", connectionId);
        jobDataMap.put("timestamp", timestamp);
        jobDataMap.put("debugMode", scheduler.getDebugMode());

        triggerNotifications(schedulerId, "pre", null);

        sendRunningJobsNotification();

        // delete existing log files with the same 'executionId'
        LogFileUtility.deleteByExecutionId(execId);

        ExecutionEventPublisher.publish(
                new ExecutionStartedEvent(execId, connectionId, schedulerId, timestamp)
        );
    }

    @AfterReturning("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendAfter(JobExecutionContext context) {
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        boolean licenseIsValid = jobDataMap.getBoolean("licenseIsValid");
        if (!licenseIsValid) {
            return;
        }

        long execId = jobDataMap.getLong("execId");
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data.getScheduleId();

        updateExecutionObj(execId, true);
        List<Operation> operations = (List<Operation>) context.get("operationsEx");
        executeAggregator(operations, execId);

        triggerNotifications(schedulerId, "post", null);

        // ExecutionLifecycleEventHandler announces the end of the execution to the running-jobs
        // subscribers once it has handled this event
        ExecutionEventPublisher.publish(
                new ExecutionFinishedEvent(execId, schedulerId, data.getExecType(), SUCCESS)
        );
    }

    @AfterThrowing(pointcut = "execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)",
            throwing = "ex")
    public void sendAlert(JobExecutionContext context, Exception ex) {
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        boolean licenseIsValid = jobDataMap.getBoolean("licenseIsValid");
        if (!licenseIsValid) {
            return;
        }

        long execId = jobDataMap.getLong("execId");
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data.getScheduleId();

        updateExecutionObj(execId, false);
        List<Operation> operations = (List<Operation>) context.get("operationsEx");
        executeAggregator(operations, execId);

        triggerNotifications(schedulerId, "alert", ex);

        // see sendAfter: the end of the execution is announced by ExecutionLifecycleEventHandler
        final String result = ex instanceof ExecutionTerminatedException ? TERMINATED : FAIL;
        ExecutionEventPublisher.publish(
                new ExecutionFinishedEvent(execId, schedulerId, data.getExecType(), result)
        );
    }

    @PostConstruct
    void listenToRefusedStarts() {
        runGate.onRefusal(this::recordRefusedStart);
    }

    /**
     * Records a start that {@link WorkflowRunGate} refused, or dropped from its queue, as a failed
     * execution of its schedule that starts and ends at once, so it shows in the history and as
     * the last failure. The webhook starts of a schedule that were refused on the call while a
     * run went come as one refusal, so they are one such execution, and so do the cron fires of a
     * schedule that were skipped because an earlier one already waited. With debug mode on, or
     * for a support file, its log holds the reason. No notification is sent and no aggregator
     * runs: nothing of the workflow ran, and the refusal already went to the workflow's websocket
     * channel.
     */
    private void recordRefusedStart(QuartzJobScheduler.ScheduleData data, long connectionId,
            GlobalVariableConflictException refusal) {
        int schedulerId = data.getScheduleId();
        Scheduler scheduler = schedulerService.getById(schedulerId);
        long execId = initExecutionObj(schedulerId);
        String timestamp = LocalDateTime.now().format(LogConstant.DATE_TIME_FORMATTER);
        ExecutionEventPublisher.publish(new ExecutionStartedEvent(execId, connectionId, schedulerId, timestamp));

        boolean loggingEnabled = scheduler.getDebugMode()
                || data.getExecType() == QuartzJobScheduler.TriggerType.SUPPORT_FILE;
        OcLogger<ExecutionLog> executionLogger =
                new OcLogger<>(loggingEnabled, new ExecutionLog(), connectionId, timestamp, execId);
        try {
            executionLogger.logAndSend("phase=EXECUTION_START id=%d connectionId=%d schedulerId=%d"
                    .formatted(execId, connectionId, schedulerId));
            // the reason alone: a stack trace of the gate would tell the reader nothing
            executionLogger.logAndSend("segment=EXCEPTION data=" + refusal);
            executionLogger.logAndSend("phase=EXECUTION_END id=%d connectionId=%d schedulerId=%d"
                    .formatted(execId, connectionId, schedulerId));
        } finally {
            executionLogger.clear();
        }

        updateExecutionObj(execId, false);
        ExecutionEventPublisher.publish(
                new ExecutionFinishedEvent(execId, schedulerId, data.getExecType(), FAIL));
    }

    private long initExecutionObj(int schedulerId) {
        Execution execution = new Execution();
        Scheduler scheduler = new Scheduler();
        scheduler.setId(schedulerId);
        execution.setScheduler(scheduler);
        execution.setStartTime(new Date());
        return executionService.save(execution)
                .getId();
    }

    private void updateExecutionObj(long execId, boolean success) {
        Execution execution = executionService.getById(execId);
        execution.setEndTime(new Date());
        execution.setStatus(success ? "S" : "F");
        executionService.save(execution);
        LastExecution le;
        if (lastExecutionService.existsBySchedulerId(execution.getScheduler().getId())) {
            le = lastExecutionService.findBySchedulerId(execution.getScheduler().getId());
        } else {
            le = new LastExecution();
        }
        // The log lines of this execution are still being processed asynchronously, so its log
        // cannot be judged here. The flag is reset for the new execution and set by
        // ExecutionLifecycleEventHandler once the execution's log has been stored.
        if (success) {
            le.setSuccessDuration(execution.getEndTime().getTime() - execution.getStartTime().getTime());
            le.setSuccessStartTime(execution.getStartTime());
            le.setSuccessEndTime(execution.getEndTime());
            le.setSuccessHasLog(false);
            le.setSuccessExecutionId(execution.getId());
        } else {
            le.setFailDuration(execution.getEndTime().getTime() - execution.getStartTime().getTime());
            le.setFailStartTime(execution.getStartTime());
            le.setFailEndTime(execution.getEndTime());
            le.setFailHasLog(false);
            le.setFailExecutionId(execution.getId());
        }
        if (le.getScheduler() == null) {
            le.setScheduler(execution.getScheduler());
        }
        lastExecutionService.save(le);
    }

    private void triggerNotifications(int schedulerId, String eventType, Exception ex) {
        List<EventNotification> eventNotifications = schedulerService.getAllNotifications(schedulerId);
        // the global variables of the workflow, read once and only if a template uses one
        GlobalVariableSnapshot globals = null;

        for (EventNotification en : eventNotifications) {
            Set<EventRecipient> recipients = en.getEventRecipients();

            if (!en.getEventType().equals(eventType)) {
                continue;
            }

            if (recipients.isEmpty()) {
                fillDefaultRecipients(recipients, en.getEventMessage().getType());
            }

            if (recipients.isEmpty()) {
                logger.warn("No recipient is configured for type = {} and schedulerId = {}", eventType, schedulerId);
                continue;
            }

            for (EventRecipient er : recipients) {
                User user = userService.findByEmail(er.getDestination()).orElse(null);
                String lang = user == null
                        ? languageService.getDefault()
                        : languageService.normalize(user.getUserDetail().getLang())
                                .orElseGet(languageService::getDefault);
                List<EventContent> contents = en.getEventMessage().getEventContents();
                EventContent content = findContentByLanguage(contents, lang).orElse(null);
                if (content == null) {
                    String defaultLang = languageService.getDefault();
                    content = findContentByLanguage(contents, defaultLang)
                            .orElseThrow(() -> new RuntimeException("Default language(" + defaultLang + ") of content not found"));
                }

                String body = content.getBody();
                String title = content.getSubject();
                if (GlobalTextRenderer.hasTokens(body) || GlobalTextRenderer.hasTokens(title)) {
                    if (globals == null) {
                        globals = takeGlobalSnapshot(schedulerId);
                    }
                    // globals first: what a value brings in is then at most a notification
                    // constant, never another global variable
                    body = renderGlobals(body, globals);
                    title = renderGlobals(title, globals);
                }

                String message = replaceConstants(body, user, ex, en);
                String subject = replaceConstants(title, user, ex, en);
                String to = er.getDestination();
                String type = en.getEventMessage().getType();// email, incoming_webhook
                try {
                    switch (type) {
                        case "incoming_webhook" -> incomingWebhookService.sendMessage(to, subject, message);
                        case "email" -> emailService.sendMessage(to, subject, message);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to send notification", e);
                }
            }
        }
    }

    /**
     * Reads the global variables a notification of this schedule may use: the ones in the scope
     * of its workflow, as they are now, which is after the run saved what it wrote.
     */
    private GlobalVariableSnapshot takeGlobalSnapshot(int schedulerId) {
        try {
            Scheduler scheduler = schedulerService.getById(schedulerId);
            return globalVariableSnapshotService.takeFor(scheduler.getConnection().getId());
        } catch (RuntimeException e) {
            logger.warn("Global variables could not be read for the notifications of schedulerId = {}", schedulerId, e);
            return GlobalVariableSnapshot.empty();
        }
    }

    /**
     * Replaces the global variable references of a notification text. A notification is sent
     * even if a reference cannot be resolved: that reference stays as it is written, so the
     * reader sees what is missing, and the reason is logged.
     */
    private String renderGlobals(String text, GlobalVariableSnapshot globals) {
        try {
            return GlobalTextRenderer.render(text, reference -> {
                try {
                    return GlobalValueCaster.toText(GlobalValueResolver.resolve(globals, reference));
                } catch (RuntimeException e) {
                    logger.warn("Notification keeps {} as written: {}", reference.getRaw(), e.getMessage());
                    return reference.getRaw();
                }
            });
        } catch (RuntimeException e) {
            logger.warn("Global variables of a notification text could not be resolved: {}", e.getMessage());
            return text;
        }
    }

    /**
     * Finds the template content written in the given language. Contents are matched on their
     * canonical language code, so a template stored with a legacy code such as 'eng' still resolves
     * for a user whose language is 'en'.
     */
    private Optional<EventContent> findContentByLanguage(List<EventContent> contents, String language) {
        return contents.stream()
                .filter(c -> languageService.normalize(c.getLanguage())
                        .filter(language::equals)
                        .isPresent())
                .findFirst();
    }

    // type: email, incoming_webhook
    private void fillDefaultRecipients(Set<EventRecipient> recipients, String type) {
        String destination;
        switch (type) {
            case "email" -> {
                destination = SecurityContextHolder.getContext().getAuthentication().getName();
                if (EmailUtility.isValid(destination)) {
                    recipients.add(new EventRecipient(destination));
                }
            }
            case "incoming_webhook" -> {
                String[] webhooks = env.getProperty(AppYamlPath.INCOMING_WEBHOOK, String[].class);
                if (webhooks == null) {
                    return;
                }
                for (String url : webhooks) {
                    recipients.add(new EventRecipient(url));
                }
            }
            default ->
                    throw new RuntimeException("Couldn't find tool type: " + type + ". Check application.yaml file;");
        }
    }

    private String replaceArgs(String text, EventNotification en) {
        String result = text;
        // for smart notification.
        List<Long> indexes = getConstants(text, "\\{\\{([^{}]+)\\}\\}").stream().map(Long::getLong).toList();
//        List<String> args = indexes.stream().map(i -> argumentServiceImp
//                .findById(i).get().getName())
//                .collect(Collectors.toList());
        Map<String, String> argsValues = getArgsValues(indexes, en);
        for (Map.Entry<String, String> entry : argsValues.entrySet()) {
            String arg = entry.getKey();
            String value = entry.getValue();
            String s = "{{" + arg + "}}";
            result = result.replace(s, value);
        }

        return result;
    }

    private String replaceConstants(String text, User user, Exception ex, EventNotification en) {
        String result = text;
        List<String> constants = getConstants(text, "\\{([^{}]+)\\}(?![}])");
        Map<String, String> cValues = getConstantValues(constants, user, ex, en);
        if (cValues != null) {
            for (Map.Entry<String, String> entry : cValues.entrySet()) {
                String constant = entry.getKey();
                String value = entry.getValue();
                String s = "{" + constant + "}";
                result = result.replace(s, value);
            }
        }

        // for smart notification.
        List<String> args = getConstants(text, "\\{\\{([^{}]+)\\}\\}");
        List<Long> indexes = args.stream().filter(str -> str.matches("-?\\d+(\\.\\d+)?")).map(Long::parseLong).toList();
        Map<String, String> argsValues = getArgsValues(indexes, en);
        String et = en.getEventType();
        if (argsValues != null && (et.equalsIgnoreCase("post") || et.equalsIgnoreCase("alert"))) {
            for (Map.Entry<String, String> entry : argsValues.entrySet()) {
                String arg = entry.getKey();
                String value = entry.getValue();
                String s = "{{" + arg + "}}";
                result = result.replace(s, value);
            }
        }
        return result;
    }

    private Map<String, String> getArgsValues(List<Long> indexes, EventNotification en) {
        LastExecution le = schedulerService.findById(en.getScheduler().getId()).get().getLastExecution();
        long exId = Math.max(le.getFailExecutionId(), le.getSuccessExecutionId());
        Execution execution = executionService.findById(exId).orElse(null);
        Objects.requireNonNull(execution);
        Map<String, String> resultMap = execution.getExecutionArguments().stream()
                .filter(ea -> indexes.contains(ea.getArgument().getId()))
                .collect(Collectors.toMap(ea -> Long.toString(ea.getArgument().getId()), ExecutionArgument::getValue));

        indexes.stream()
                .filter(id -> !resultMap.containsKey(Long.toString(id)))
                .forEach(id -> resultMap.put(Long.toString(id), "n/a"));
        return resultMap;
    }

    private List<String> getConstants(String text, String regex) {
        ArrayList<String> constants = new ArrayList<>();
        Pattern p = Pattern.compile(regex);
        Matcher m = p.matcher(text);

        while (m.find()) {
            constants.add(m.group(1));
        }
        return constants;
    }

    private Map<String, String> getConstantValues(List<String> constants, User user, Exception ex, EventNotification en) {
        if (constants == null || constants.isEmpty()) {
            return null;
        }
        Scheduler scheduler = schedulerService.findById(en.getScheduler()
                .getId()).orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));
        Connection connection = connectionService.getById(scheduler.getConnection().getId());
        Map<String, String> cValues = new HashMap<>();
        constants.forEach(c -> {
            switch (c) {
                case "USER_NAME":
                    String userName = user.getUserDetail().getName();
                    cValues.put(c, userName);
                    break;
                case "USER_SURNAME":
                    String surName = user.getUserDetail().getSurname();
                    cValues.put(c, surName);
                    break;
                case "USER_TITLE":
                    String userTitle = user.getUserDetail().getTitle();
                    cValues.put(c, userTitle);
                    break;
                case "USER_DEPARTMENT":
                    String department = user.getUserDetail().getDepartment();
                    cValues.put(c, department);
                    break;
                case "CONNECTION_ID":
                    cValues.put(c, Long.toString(connection.getId()));
                    break;
                case "CONNECTION_NAME":
                    cValues.put(c, connection.getTitle());
                    break;
                case "SCHEDULER_ID":
                    cValues.put(c, Integer.toString(scheduler.getId()));
                    break;
                case "SCHEDULER_TITLE":
                    cValues.put(c, scheduler.getTitle());
                    break;
                default:
            }
        });
        return cValues;
    }

    // TODO: Refactor so that Execution of aggregator should be in separate class;
    private void executeAggregator(List<Operation> operations, long execId) {
        Execution execution = executionService.getById(execId);
        if (operations == null) {
            return;
        }
        operations.stream()
                .filter(op -> (op.getAggregatorId() != null) && (op.getAggregatorId() != 0))
                .forEach(op -> {
                    DataAggregator da = dataAggregatorService.getById(op.getAggregatorId());
                    if (!da.isActive()) {
                        return;
                    }
                    List<JSHttpObject> responseObjects = op.getResponses().values()
                            .stream()
                            .map(JSHttpObject::new).toList();

                    List<JSHttpObject> requestObjects = op.getRequests().values()
                            .stream()
                            .map(JSHttpObject::new).toList();
                    List<ExecutionArgument> exarg = getExecutionArgs(da.getScript(), responseObjects, requestObjects, da.getArgs(), execution);
                    execution.setExecutionArguments(exarg);
                    if (execution.getExecutionArguments() != null && !execution.getExecutionArguments().isEmpty()) {
                        executionService.save(execution);
                    }
                });
    }

    private List<ExecutionArgument> getExecutionArgs(String script, List<JSHttpObject> responses, List<JSHttpObject> requests, Set<Argument> args, Execution execution) {
        try {
            ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
            String stringifiedResponses = new ObjectMapper().writeValueAsString(responses);
            engine.put("dataModel", stringifiedResponses);
            JSObject objRes = (JSObject)engine.eval("JSON.parse(dataModel)");
            engine.put(AggrConst.RESPONSES, objRes);

            String stringifiedRequests = new ObjectMapper().writeValueAsString(requests);
            engine.put("dataModel", stringifiedRequests);
            JSObject objReq = (JSObject)engine.eval("JSON.parse(dataModel)");
            engine.put(AggrConst.REQUESTS, objReq);
            engine.eval(script);

            List<ExecutionArgument> executionArguments = new ArrayList<>();
            args.forEach(arg -> {
                Object value = engine.get(arg.getName());
                if (value == null) {
                    return;
                }
                ExecutionArgument executionArgument = new ExecutionArgument();
                executionArgument.setExecution(execution);
                executionArgument.setArgument(arg);
                executionArgument.setValue(value.toString());
                executionArguments.add(executionArgument);
            });
            return executionArguments;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private void sendRunningJobsNotification() {
        try {
            List<RunningJobsResource> allRunningJobs = schedulerService.getAllRunningJobs();
            notificationService.send(SocketConstant.SCHEDULER_DESTINATION, allRunningJobs);
        } catch (Exception e) {}
    }
}
