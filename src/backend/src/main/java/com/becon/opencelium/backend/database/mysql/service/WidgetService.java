package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.resource.user.WidgetResource;

import java.util.List;
import java.util.Optional;

public interface WidgetService {
    void save(Widget widget);
    Optional<Widget> findById(int id);
    void deleteById(int id);
    Widget toEntity(WidgetResource widgetResource);
    WidgetResource toResource(Widget widget);

    List<Widget> findAll();
}
