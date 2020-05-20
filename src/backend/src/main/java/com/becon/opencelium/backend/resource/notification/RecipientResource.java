package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Recipient;
import org.springframework.hateoas.ResourceSupport;

import java.util.List;

public class RecipientResource extends ResourceSupport {

    private int recipientId;
    private String recipientDescription;

    public RecipientResource(Recipient recipient){
        this.recipientId = recipient.getId();
        this.recipientDescription = recipient.getDescription();
    }

    public int getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(int recipientId) {
        this.recipientId = recipientId;
    }

    public String getRecipientDescription() {
        return recipientDescription;
    }

    public void setRecipientDescription(String recipientDescription) {
        this.recipientDescription = recipientDescription;
    }
}
