package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.EventRecipient;
import org.springframework.hateoas.ResourceSupport;

public class RecipientResource extends ResourceSupport {

    private int recipientId;
    private String description;

    public RecipientResource(EventRecipient eventRecipient){
        this.recipientId = eventRecipient.getId();
        this.description = eventRecipient.getDestination();
    }

    public RecipientResource() {
    }

    public int getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(int recipientId) {
        this.recipientId = recipientId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
