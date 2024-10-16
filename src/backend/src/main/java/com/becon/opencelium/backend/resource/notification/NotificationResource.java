package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.EventRecipient;
import jakarta.annotation.Resource;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Resource
public class NotificationResource {

    private int notificationId;
    private int schedulerId; // should be array
    private String name;
    private String eventType;// post, pref, alert
    private String notificationType;
    private TemplateMessageResource template;
    //private MessageResource template;
    private List<String> recipients = new ArrayList<>();
    private String team;
    private String channel;

    public NotificationResource(EventNotification eventNotification){

        this.notificationId = eventNotification.getId();
        this.name = eventNotification.getName();
        this.eventType = eventNotification.getEventType();
        this.schedulerId = eventNotification.getScheduler().getId();
        this.notificationType = eventNotification.getEventMessage().getType();
        this.template = new TemplateMessageResource(eventNotification.getEventMessage().getId(), eventNotification.getEventMessage().getName());
        //this.template = new MessageResource(eventNotification.getEventMessage());
        this.recipients = eventNotification.getEventRecipients().stream()
                .map(EventRecipient::getDestination)
                .collect(Collectors.toList());
    }

    public NotificationResource() {

    }

    public int getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(int notificationId) {
        this.notificationId = notificationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }


    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

    public List<String> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<String> recipients) {
        this.recipients = recipients;
    }


    /*public MessageResource getTemplate() {
        return template;
    }

    public void setTemplate(MessageResource template) {
        this.template = template;
    }*/

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

   /* public int getTemplateId() {
        return templateId;
    }

    public void setTemplateId(int templateId) {
        this.templateId = templateId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }*/

    public TemplateMessageResource getTemplate() {
        return template;
    }

    public void setTemplate(int id, String name) {
        this.template = new TemplateMessageResource(id, name);
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }
}
