package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.EventRecipient;
import com.becon.opencelium.backend.mysql.repository.RecipientRepository;
import com.becon.opencelium.backend.resource.notification.RecipientResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RecipientServiceImpl implements RecipientService{
    @Autowired
    RecipientRepository recipientRepository;
    @Override
    public void save(EventRecipient eventRecipient) {
        recipientRepository.save(eventRecipient);
    }

    @Override
    public void deleteById(int id) {
        recipientRepository.deleteById(id);
    }

    @Override
    public List<EventRecipient> findAll() {
        return recipientRepository.findAll();
    }

    @Override
    public Optional<EventRecipient> findById(int id) {
        return recipientRepository.findById(id);
    }

    @Override
    public EventRecipient toEntity(RecipientResource recipientResource) {
        EventRecipient eventRecipient = new EventRecipient(recipientResource);
        return eventRecipient;
    }

    @Override
    public RecipientResource toResource(EventRecipient eventRecipient) {
        RecipientResource recipientResource = new RecipientResource(eventRecipient);
        return recipientResource;
    }
}
