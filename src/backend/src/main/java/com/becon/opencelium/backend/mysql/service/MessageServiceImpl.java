package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.EventContent;
import com.becon.opencelium.backend.mysql.entity.EventMessage;
import com.becon.opencelium.backend.mysql.repository.MessageRepository;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ContentServiceImpl contentService;

    @Override
    public void save(EventMessage eventMessage) {
        messageRepository.save(eventMessage);
        eventMessage.getEventContents().forEach(content -> contentService.save(content));
    }

    @Override
    public void deleteById(int id) {
        findById(id).orElseThrow(()->new RuntimeException("TEMPLATE_NOT_FOUND"));
        messageRepository.deleteById(id);
    }

    @Override
    public List<EventMessage> findAll() {
        return messageRepository.findAll();
    }

    @Override
    public Optional<EventMessage> findById(int id) {
        return messageRepository.findById(id);
    }

    @Override
    public List<EventMessage> findAllByType(String type) {
        return messageRepository.findAllByType(type);
    }

    @Override
    public EventMessage toEntity(MessageResource messageResource) {
        EventMessage eventMessage = new EventMessage();
        eventMessage.setId(messageResource.getTemplateId());
        eventMessage.setName(messageResource.getName());
        eventMessage.setType(messageResource.getType());

        List<EventContent> eventContents = messageResource.getContent()
                .stream().map(EventContent::new).collect(Collectors.toList());

        eventContents.forEach(content -> content.setEventMessage(eventMessage));
        eventMessage.setEventContents(eventContents);

        return eventMessage;
    }

    @Override
    public MessageResource toResource(EventMessage eventMessage) {
        return new MessageResource(eventMessage);
    }
}
