package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.EventContent;
import com.becon.opencelium.backend.mysql.repository.ContentRepository;
import com.becon.opencelium.backend.resource.notification.ContentResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContentServiceImpl implements ContentService {

    @Autowired
    ContentRepository contentRepository;

    @Override
    public void save(EventContent eventContent) {
        contentRepository.save(eventContent);
    }

    @Override
    public void deleteById(int id) {
        contentRepository.deleteById(id);
    }

    @Override
    public List<EventContent> findAll() {
        return contentRepository.findAll();
    }

    @Override
    public Optional<EventContent> findById(int id) {
        return contentRepository.findById(id);
    }

    @Override
    public EventContent toEntity(ContentResource contentResource) {
        EventContent eventContent = new EventContent();
        eventContent.setSubject(contentResource.getSubject());
        eventContent.setBody(contentResource.getBody());
        eventContent.setLanguage(contentResource.getLanguage());
        return eventContent;
    }

    @Override
    public ContentResource toResource(EventContent eventContent) {
        return new ContentResource(eventContent);
    }
}
