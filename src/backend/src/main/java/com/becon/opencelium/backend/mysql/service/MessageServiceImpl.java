package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Content;
import com.becon.opencelium.backend.mysql.entity.Message;
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
    MessageRepository messageRepository;

    @Autowired
    ContentServiceImpl contentService;

    @Override
    public void save(Message message) {
        messageRepository.save(message);
        message.getContents().forEach(content -> contentService.save(content));
    }

    @Override
    public void deleteById(int id) {
        messageRepository.deleteById(id);
    }

    @Override
    public List<Message> findAll() {
        return messageRepository.findAll();
    }

    @Override
    public Optional<Message> findById(int id) {
        return messageRepository.findById(id);
    }

    @Override
    public Message toEntity(MessageResource messageResource) {
        Message message = new Message();
        message.setId(messageResource.getTemplateId());
        message.setName(messageResource.getName());
        message.setType(messageResource.getType());

        List<Content> contents = messageResource.getContent()
                .stream().map(Content::new).collect(Collectors.toList());

        contents.forEach(content -> content.setMessage(message));
        message.setContents(contents);

        return message;
    }

    @Override
    public MessageResource toResource(Message message) {
        return new MessageResource(message);
    }
}
