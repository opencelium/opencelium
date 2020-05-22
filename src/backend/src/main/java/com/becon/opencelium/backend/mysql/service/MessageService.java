package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.EventMessage;
import com.becon.opencelium.backend.resource.notification.MessageResource;

import java.util.List;
import java.util.Optional;

public interface MessageService {

    void save(EventMessage eventMessage);
    void deleteById(int id);
    List<EventMessage>findAll();
    Optional<EventMessage> findById(int id);

    EventMessage toEntity(MessageResource messageResource);
    MessageResource toResource(EventMessage eventMessage);
}
