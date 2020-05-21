package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Content;
import com.becon.opencelium.backend.resource.notification.ContentResource;

import java.util.List;
import java.util.Optional;

public interface ContentService {
    void save(Content content);
    void deleteById(int id);
    List<Content> findAll();
    Optional<Content> findById(int id);

    Content toEntity(ContentResource contentResource);
    ContentResource toResource(Content content);
}
