package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Message;
import com.becon.opencelium.backend.mysql.repository.ContentRepository;
import com.becon.opencelium.backend.mysql.repository.MessageRepository;
import com.becon.opencelium.backend.resource.notification.MessageResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    MessageRepository messageRepository;

    @Autowired
    ContentServiceImpl contentService;

    @Override
    public void save(Message message) {
        messageRepository.save(message);
    }

    @Override
    public void deleteById(int id) {
        messageRepository.deleteById(id);
    }

    @Override
    public List<Message> findAll() {
        return null;
    }

    @Override
    public Optional<Message> findById(int id) {
        return messageRepository.findById(id);
    }

    @Override
    public Message toEntity(MessageResource messageResource) {
        Message message = new Message();
        message.setId(messageResource.getMessageId());
        message.setName(messageResource.getTemplateName());
        message.setType(messageResource.getTemplateType());
        message.setContent(contentService.findById(messageResource.getContentId()).orElseThrow(()-> new RuntimeException("CONTENT_NOT_FOUND")));

        return message;
    }

    @Override
    public MessageResource toResource(Message message) {
        return new MessageResource(message);
    }
}
