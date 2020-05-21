package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Recipient;
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
    public void save(Recipient recipient) {
        recipientRepository.save(recipient);
    }

    @Override
    public void deleteById(int id) {
        recipientRepository.deleteById(id);
    }

    @Override
    public List<Recipient> findAll() {
        return recipientRepository.findAll();
    }

    @Override
    public Optional<Recipient> findById(int id) {
        return recipientRepository.findById(id);
    }

    @Override
    public Recipient toEntity(RecipientResource recipientResource) {
        Recipient recipient = new Recipient(recipientResource);
        return recipient;
    }

    @Override
    public RecipientResource toResource(Recipient recipient) {
        RecipientResource recipientResource = new RecipientResource(recipient);
        return recipientResource;
    }
}
