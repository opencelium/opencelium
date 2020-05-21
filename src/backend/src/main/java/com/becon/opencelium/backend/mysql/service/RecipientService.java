package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Message;
import com.becon.opencelium.backend.mysql.entity.Recipient;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import com.becon.opencelium.backend.resource.notification.RecipientResource;

import java.util.List;
import java.util.Optional;

public interface RecipientService {
    void save(Recipient recipient);
    void deleteById(int id);
    List<Recipient> findAll();
    Optional<Recipient> findById(int id);

    Recipient toEntity(RecipientResource recipientResource);
    RecipientResource toResource(Recipient recipient);
}
