package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Content;
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
    public void save(Content content) {
        contentRepository.save(content);
    }

    @Override
    public void deleteById(int id) {
        contentRepository.deleteById(id);
    }

    @Override
    public List<Content> findAll() {
        return contentRepository.findAll();
    }

    @Override
    public Optional<Content> findById(int id) {
        return contentRepository.findById(id);
    }

    @Override
    public Content toEntity(ContentResource contentResource) {
        Content content = new Content();
        content.setId(contentResource.getContentId());
        content.setSubject(contentResource.getContentSubject());
        content.setBody(contentResource.getContentBody());
        content.setLanguage(contentResource.getContentLanguage());
        return content;
    }

    @Override
    public ContentResource toResource(Content content) {
        return new ContentResource(content);
    }
}
