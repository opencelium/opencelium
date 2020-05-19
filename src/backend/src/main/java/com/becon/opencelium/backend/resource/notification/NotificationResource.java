package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Notification;
import com.becon.opencelium.backend.mysql.entity.NotificationHasRecipient;
import com.becon.opencelium.backend.mysql.entity.Recipient;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import org.springframework.hateoas.ResourceSupport;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class NotificationResource extends ResourceSupport {

    private int notificationId;
    private String notificationName;
    private String notificationEventType;
    private String notificationApp;
    private String notificationText;
    private int schedulerId;
    private List<String> notificationRecipients = new ArrayList<>();
    //private List<RecipientResource> recipientResources = new ArrayList<>();

    public NotificationResource(Notification notification){

        this.notificationId = notification.getId();
        this.notificationName = notification.getName();
        this.notificationEventType = notification.getEventType();
        this.notificationApp = notification.getApp();
        this.notificationText = notification.getText();
        this.schedulerId = notification.getScheduler().getId();

        this.notificationRecipients = notification.getRecipients().stream()
                .map(NotificationHasRecipient::getRecipient)
                .collect(Collectors.toList()).stream().map(Recipient::getDescription)
                .collect(Collectors.toList());

        /*this.recipientResources = notification.getRecipients().stream()
                .map(NotificationHasRecipient::getRecipient)
                .collect(Collectors.toList()).stream().map(RecipientResource::new)
                .collect(Collectors.toList());*/

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

    public String getNotificationText() {
        return notificationText;
    }

    public void setNotificationText(String notificationText) {
        this.notificationText = notificationText;
    }

    public int getSchedulerId() {
        return schedulerId;
    }

    public void setSchedulerId(int schedulerId) {
        this.schedulerId = schedulerId;
    }

    public List<String> getNotificationRecipients() {
        return notificationRecipients;
    }

    public void setNotificationRecipients(List<String> notificationRecipients) {
        this.notificationRecipients = notificationRecipients;
    }
}
