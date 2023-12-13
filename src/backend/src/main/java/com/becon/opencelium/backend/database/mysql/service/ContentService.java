package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import com.becon.opencelium.backend.resource.notification.ContentResource;

import java.util.List;
import java.util.Optional;

public interface ContentService {
    void save(EventContent eventContent);
    void deleteById(int id);
    List<EventContent> findAll();
    Optional<EventContent> findById(int id);

    EventContent toEntity(ContentResource contentResource);
    ContentResource toResource(EventContent eventContent);
}
