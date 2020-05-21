package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Notification;
import com.becon.opencelium.backend.mysql.entity.NotificationHasRecipient;
import org.springframework.hateoas.ResourceSupport;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class NotificationResource extends ResourceSupport {

    private int notificationId;
    private int schedulerId;
    private String name;
    private String eventType;
    private String app;
    private int messageId;
    //private List<String> notificationRecipients = new ArrayList<>();
    private List<RecipientResource> recipients = new ArrayList<>();

    public NotificationResource(Notification notification){

        this.notificationId = notification.getId();
        this.name = notification.getName();
        this.eventType = notification.getEventType();
        this.app = notification.getApp();
        this.schedulerId = notification.getScheduler().getId();
        this.messageId = notification.getMessage().getId();

        /*this.notificationRecipients = notification.getNotificationHasRecipients().stream()
                .map(NotificationHasRecipient::getRecipient)
                .collect(Collectors.toList()).stream().map(Recipient::getDescription)
                .collect(Collectors.toList());*/

        this.recipients = notification.getNotificationHasRecipients().stream()
                .map(NotificationHasRecipient::getRecipient)
                .collect(Collectors.toList()).stream().map(RecipientResource::new)
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

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

/*    public List<String> getNotificationRecipients() {
        return notificationRecipients;
    }

    public void setNotificationRecipients(List<String> notificationRecipients) {
        this.notificationRecipients = notificationRecipients;
    }*/

    public int getMessageId() {
        return messageId;
    }

    public void setMessageId(int messageId) {
        this.messageId = messageId;
    }

    public List<RecipientResource> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<RecipientResource> recipients) {
        this.recipients = recipients;
    }
}
