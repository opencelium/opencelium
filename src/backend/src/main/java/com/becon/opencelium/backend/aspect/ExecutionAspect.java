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


import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.enums.LangEnum;
import com.becon.opencelium.backend.execution.notification.EmailServiceImpl;
import com.becon.opencelium.backend.execution.notification.IncomingWebhookService;
import com.becon.opencelium.backend.mysql.entity.*;
import com.becon.opencelium.backend.mysql.service.*;
import com.becon.opencelium.backend.quartz.JobExecutor;
import org.aspectj.lang.annotation.*;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Aspect
@Component
public class ExecutionAspect {

    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    @Autowired
    private SchedulerServiceImp schedulerServiceImp;

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private EmailServiceImpl emailService;

    @Autowired
    private IncomingWebhookService slackService;

    @Autowired
    private ExecutionServiceImp executionServiceImp;

    @Autowired
    private ArgumentServiceImp argumentServiceImp;

    @Autowired
    private Environment env;


    @Before("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendBefore(JobExecutionContext context){
        logger.info("------------------- PRE --------------------");
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        int schedulerId = jobDataMap.getIntValue("schedulerId");
        List<EventNotification> eventNotifications = schedulerServiceImp.getAllNotifications(schedulerId);
        triggerNotifications(eventNotifications, "pre", null);
    }

    @After("execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)")
    public void sendAfter(JobExecutionContext context){
        logger.info("------------------- POST --------------------");
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        int schedulerId = jobDataMap.getIntValue("schedulerId");
        List<EventNotification> en = schedulerServiceImp.getAllNotifications(schedulerId);
        triggerNotifications(en, "post", null);
    }

    @AfterThrowing(pointcut = "execution(* com.becon.opencelium.backend.quartz.JobExecutor.executeInternal(..)) && args(context)",
                   throwing="ex")
    public void sendAlert(JobExecutionContext context, Exception ex){
        logger.info("------------------- EXCEPTION --------------------");
        JobDataMap jobDataMap = context.getMergedJobDataMap();
        int schedulerId = jobDataMap.getIntValue("schedulerId");
        List<EventNotification> en = schedulerServiceImp.getAllNotifications(schedulerId);
        triggerNotifications(en, "alert", ex);
    }

    private void triggerNotifications(List<EventNotification> eventNotifications, String eventType, Exception ex) {
        String to, subject, message;
        for (EventNotification evtn : eventNotifications) {
            if (!evtn.getEventType().equals(eventType)){
                continue;
            }
            if (evtn.getEventRecipients() == null || evtn.getEventRecipients().isEmpty()) {
                if (evtn.getEventMessage().getType().equalsIgnoreCase("incoming_webhook")) {
                    String[] defaultRecipients = env.getProperty(YamlPropConst.INCOMING_WEBHOOK, String[].class);
                    if (defaultRecipients != null) {
                        for (String defaultRecipient : defaultRecipients) {
                            evtn.getEventRecipients().add(new EventRecipient(defaultRecipient));
                        }
                    }
                }
            }
            for (EventRecipient er : evtn.getEventRecipients()) {
                User user = userService.findByEmail(er.getDestination()).orElse(null);
                String lang =  user == null ? "en" : user.getUserDetail().getLang();
                EventContent content = evtn.getEventMessage().getEventContents().stream()
                        .filter(c -> c.getLanguage().equalsIgnoreCase(lang)).findFirst().orElse(null);
                if (content == null) {
                    String defaultLang = LangEnum.EN.getCode();
                    content = evtn.getEventMessage().getEventContents().stream()
                            .filter(c -> c.getLanguage().equals(defaultLang)).findFirst()
                            .orElseThrow(() -> new RuntimeException("Default language(" + defaultLang + ") of content not found"));
                }

                message = replaceConstants(content.getBody(), user, ex, evtn);
                subject = replaceConstants(content.getSubject(), user, ex, evtn);
                to = er.getDestination();
                String type = evtn.getEventMessage().getType();// email, income_webhook etc
                try {
                    if (type.equals("email")) {
                        emailService.sendMessage(to, subject, message);
                    } else if (type.equals("slack") || type.equalsIgnoreCase("incoming_webhook")) {
                        slackService.sendMessage(to, subject, message);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
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
        LastExecution le = schedulerServiceImp.findById(en.getScheduler().getId()).get().getLastExecution();
        long exId = Math.max(le.getFailExecutionId(), le.getSuccessExecutionId());
        Execution execution = executionServiceImp.findById(exId).orElse(null);
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

        while (m.find()){
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
        Scheduler scheduler = schedulerServiceImp.findById(en.getScheduler()
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
                    cValues.put(c, connection.getName());
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
}
