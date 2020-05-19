
package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "notification_has_recipient")
public class NotificationHasRecipient {

    @EmbeddedId
    private NotificationHasRecipientId id;

    @ManyToOne
    @JoinColumn(name = "notification_id", insertable = false, updatable = false)
    private Notification notification;

    @ManyToOne
    @JoinColumn(name="recipient_id", insertable = false, updatable = false)
    private Recipient recipient;

    public NotificationHasRecipient() {
    }

    public NotificationHasRecipient(Notification notification, Recipient recipient) {
        this.id = new NotificationHasRecipientId(notification.getId(), recipient.getId());
        this.notification = notification;
        this.recipient = recipient;

        notification.getRecipients().add(this);
        recipient.getNotifications().add(this);
    }

    public NotificationHasRecipientId getId() {
        return id;
    }

    public void setId(NotificationHasRecipientId id) {
        this.id = id;
    }

    public Notification getNotification() {
        return notification;
    }

    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    public Recipient getRecipient() {
        return recipient;
    }

    public void setRecipient(Recipient recipient) {
        this.recipient = recipient;
    }


    @Embeddable
    public static class NotificationHasRecipientId implements Serializable {

        @Column(name = "notification_id")
        protected Integer notificationId;

        @Column(name = "recipient_id")
        protected Integer recipientId;

        public NotificationHasRecipientId() {

        }

        public NotificationHasRecipientId(Integer notificationId, Integer recipientId) {
            this.notificationId = notificationId;
            this.recipientId = recipientId;
        }

        @Override
        public int hashCode() {
            final int prime = 31;
            int result = 1;
            result = prime * result
                    + ((notificationId == null) ? 0 : notificationId.hashCode());


            result = prime * result
                    + ((recipientId == null) ? 0 : recipientId.hashCode());
            return result;
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj)
                return true;
            if (obj == null)
                return false;
            if (getClass() != obj.getClass())
                return false;

            NotificationHasRecipient.NotificationHasRecipientId other = (NotificationHasRecipient.NotificationHasRecipientId) obj;

            if (notificationId == null) {
                if (other.notificationId != null)
                    return false;
            } else if (!notificationId.equals(other.notificationId))
                return false;


            if (recipientId == null) {
                if (other.recipientId != null)
                    return false;
            } else if (!recipientId.equals(other.recipientId))
                return false;

            return true;
        }
    }
}

