package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Message;
import com.becon.opencelium.backend.resource.notification.MessageResource;

import java.util.List;
import java.util.Optional;

public interface MessageService {

    void save(Message message);
    void deleteById(int id);
    List<Message>findAll();
    Optional<Message> findById(int id);

    Message toEntity(MessageResource messageResource);
    MessageResource toResource(Message message);
}
