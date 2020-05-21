package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Message;
import com.becon.opencelium.backend.mysql.entity.Notification;
import com.becon.opencelium.backend.mysql.entity.Recipient;
import org.springframework.hateoas.ResourceSupport;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class NotificationResource extends ResourceSupport {

    private int notificationId;
    private int schedulerId;
    private String name;
    private String eventType;
    private MessageResource template;
    private List<String> recipients = new ArrayList<>();

    public NotificationResource(Notification notification){

        this.notificationId = notification.getId();
        this.name = notification.getName();
        this.eventType = notification.getEventType();
        this.schedulerId = notification.getScheduler().getId();
        this.template = new MessageResource(notification.getMessage());
        this.recipients = notification.getRecipients().stream()
                .map(Recipient::getDestination)
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


    public MessageResource getTemplate() {
        return template;
    }

    public void setTemplate(MessageResource template) {
        this.template = template;
    }
}
