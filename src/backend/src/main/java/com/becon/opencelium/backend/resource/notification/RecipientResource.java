package com.becon.opencelium.backend.resource.notification;

import com.becon.opencelium.backend.mysql.entity.Recipient;
import org.springframework.hateoas.ResourceSupport;

import java.util.List;

public class RecipientResource extends ResourceSupport {

    private String recipientDescription;

    public RecipientResource(Recipient recipient){
        this.recipientDescription = recipient.getDescription();
    }
}
