package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Recipient;
import org.springframework.hateoas.ResourceSupport;

public class RecipientResource extends ResourceSupport {

    private int recipientId;
    private String description;

    public RecipientResource(Recipient recipient){
        this.recipientId = recipient.getId();
        this.description = recipient.getDestination();
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
