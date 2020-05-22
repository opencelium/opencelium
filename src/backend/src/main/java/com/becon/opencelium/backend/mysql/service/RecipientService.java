package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.EventRecipient;
import com.becon.opencelium.backend.resource.notification.RecipientResource;

import java.util.List;
import java.util.Optional;

public interface RecipientService {
    void save(EventRecipient eventRecipient);
    void deleteById(int id);
    List<EventRecipient> findAll();
    Optional<EventRecipient> findById(int id);

    EventRecipient toEntity(RecipientResource recipientResource);
    RecipientResource toResource(EventRecipient eventRecipient);
}
