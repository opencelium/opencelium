package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Notification;
import com.becon.opencelium.backend.mysql.entity.NotificationHasRecipient;
import com.becon.opencelium.backend.mysql.entity.Recipient;
import org.springframework.hateoas.ResourceSupport;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class NotificationResource extends ResourceSupport {

    private int notificationId;
    private String notificationName;
    private String notificationEventType;
    private String notificationApp;
    private int schedulerId;
    private int messageId;
    //private List<String> notificationRecipients = new ArrayList<>();
    private List<RecipientResource> recipientResources = new ArrayList<>();

    public NotificationResource(Notification notification){

        this.notificationId = notification.getId();
        this.notificationName = notification.getName();
        this.notificationEventType = notification.getEventType();
        this.notificationApp = notification.getApp();
        this.schedulerId = notification.getScheduler().getId();
        this.messageId = notification.getMessage().getId();

        /*this.notificationRecipients = notification.getNotificationHasRecipients().stream()
                .map(NotificationHasRecipient::getRecipient)
                .collect(Collectors.toList()).stream().map(Recipient::getDescription)
                .collect(Collectors.toList());*/

        this.recipientResources = notification.getNotificationHasRecipients().stream()
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

    public String getNotificationName() {
        return notificationName;
    }

    public void setNotificationName(String notificationName) {
        this.notificationName = notificationName;
    }

    public String getNotificationEventType() {
        return notificationEventType;
    }

    public void setNotificationEventType(String notificationEventType) {
        this.notificationEventType = notificationEventType;
    }

    public String getNotificationApp() {
        return notificationApp;
    }

    public void setNotificationApp(String notificationApp) {
        this.notificationApp = notificationApp;
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

    public List<RecipientResource> getRecipientResources() {
        return recipientResources;
    }

    public void setRecipientResources(List<RecipientResource> recipientResources) {
        this.recipientResources = recipientResources;
    }
}
