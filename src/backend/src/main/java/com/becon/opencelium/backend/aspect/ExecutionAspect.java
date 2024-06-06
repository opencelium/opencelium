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


import com.becon.opencelium.backend.constant.AggrConst;
import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.service.*;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.execution.JSHttpObject;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.execution.notification.IncomingWebhookService;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.quartz.JobExecutor;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.annotation.*;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    public ExecutionAspect(
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("userServiceImpl") UserService userService,
            @Qualifier("executionServiceImp") ExecutionService executionService,
            @Qualifier("lastExecutionServiceImp") LastExecutionService lastExecutionService,
            @Qualifier("dataAggregatorServiceImp") DataAggregatorService dataAggregatorService,
            IncomingWebhookService incomingWebhookService,
            EmailServiceImpl emailService,
            Environment env
    ) {
        this.schedulerService = schedulerService;
        this.userService = userService;
        this.incomingWebhookService = incomingWebhookService;
        this.executionService = executionService;
        this.emailService = emailService;
        this.env = env;
        this.lastExecutionService = lastExecutionService;
        this.dataAggregatorService = dataAggregatorService;
    }

    @Before("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendBefore(JobExecutionContext context) {
        logger.info("------------------- PRE --------------------");

        JobDataMap jobDataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data != null ? data.getScheduleId() : jobDataMap.getIntValue("schedulerId");
        long execId = initExecutionObj(schedulerId);
        jobDataMap.put("execId", execId);

        List<EventNotification> eventNotifications = schedulerService.getAllNotifications(schedulerId);
        triggerNotifications(eventNotifications, "pre", null);
    }

    @AfterReturning("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendAfter(JobExecutionContext context) {
        logger.info("------------------- POST --------------------");

        JobDataMap jobDataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data.getScheduleId();

        long execId = jobDataMap.getLong("execId");
        updateExecutionObj(execId, true);
        List<Operation> operations = (List<Operation>) context.get("operationsEx");
        executeAggregator(operations, execId);
        List<EventNotification> en = schedulerService.getAllNotifications(schedulerId);
        triggerNotifications(en, "post", null);
    }

    @AfterThrowing(pointcut = "execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)",
            throwing = "ex")
    public void sendAlert(JobExecutionContext context, Exception ex) {
        logger.info("------------------- EXCEPTION --------------------");
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        QuartzJobScheduler.ScheduleData data = (QuartzJobScheduler.ScheduleData) jobDataMap.get("data");
        int schedulerId = data.getScheduleId();

        long execId = jobDataMap.getLong("execId");
        updateExecutionObj(execId, false);
        List<Operation> operations = (List<Operation>) context.get("operationsEx");
        executeAggregator(operations, execId);
        List<EventNotification> en = schedulerService.getAllNotifications(schedulerId);
        triggerNotifications(en, "alert", ex);
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
        if (success) {
            le.setSuccessDuration(execution.getEndTime().getTime() - execution.getStartTime().getTime());
            le.setSuccessStartTime(execution.getStartTime());
            le.setSuccessEndTime(execution.getEndTime());
            le.setSuccessExecutionId(execution.getId());
        } else {
            le.setFailDuration(execution.getEndTime().getTime() - execution.getStartTime().getTime());
            le.setFailStartTime(execution.getStartTime());
            le.setFailEndTime(execution.getEndTime());
            le.setFailExecutionId(execution.getId());
        }
        if (le.getScheduler() == null) {
            le.setScheduler(execution.getScheduler());
        }
        lastExecutionService.save(le);
    }

    private void triggerNotifications(List<EventNotification> eventNotifications, String eventType, Exception ex) {
        String to, subject, message;
        for (EventNotification en : eventNotifications) {
            if (!en.getEventType().equals(eventType)) {
                continue;
            }
            if (en.getEventRecipients().isEmpty()) {
                fillDefaultRecipients(en.getEventRecipients(), en.getEventMessage().getType());
            }
            for (EventRecipient er : en.getEventRecipients()) {
                User user = userService.findByEmail(er.getDestination()).orElse(null);
                String lang = user == null ? "en" : user.getUserDetail().getLang();
                EventContent content = en.getEventMessage().getEventContents().stream()
                        .filter(c -> c.getLanguage().equalsIgnoreCase(lang)).findFirst().orElse(null);
                if (content == null) {
                    String defaultLang = LangEnum.EN.getCode();
                    content = en.getEventMessage().getEventContents().stream()
                            .filter(c -> c.getLanguage().equals(defaultLang)).findFirst()
                            .orElseThrow(() -> new RuntimeException("Default language(" + defaultLang + ") of content not found"));
                }

                message = replaceConstants(content.getBody(), user, ex, en);
                subject = replaceConstants(content.getSubject(), user, ex, en);
                to = er.getDestination();
                String type = en.getEventMessage().getType();// email, incoming_webhook
                try {
                    switch (type) {
                        case "incoming_webhook" -> incomingWebhookService.sendMessage(to, subject, message);
                        case "email" -> emailService.sendMessage(to, subject, message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    // type: email, incoming_webhook
    private void fillDefaultRecipients(Set<EventRecipient> recipients, String type) {
        String destination;
        switch (type) {
            case "email" -> {
                destination = SecurityContextHolder.getContext().getAuthentication().getName();
                recipients.add(new EventRecipient(destination));
            }
            case "incoming_webhook" -> {
                String[] webhooks = env.getProperty(YamlPropConst.INCOMING_WEBHOOK, String[].class);
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

    @Autowired
    private ConnectionServiceImp connectionServiceImp;

    private Map<String, String> getConstantValues(List<String> constants, User user, Exception ex, EventNotification en) {
        if (constants == null || constants.isEmpty()) {
            return null;
        }
        Scheduler scheduler = schedulerService.findById(en.getScheduler()
                .getId()).orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));
        Connection connection = connectionServiceImp.findById(scheduler.getConnection().getId())
                .orElseThrow(() -> new RuntimeException("CONNECTION_NOT_FOUND"));
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

            String stringifiedRequests = new ObjectMapper().writeValueAsString(responses);
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
}
