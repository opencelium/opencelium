package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.repository.WidgetRepository;
import com.becon.opencelium.backend.resource.user.WidgetResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WidgetServiceImp implements WidgetService {

    @Autowired
    private WidgetRepository widgetRepository;

    @Override
    public void save(Widget widget) {
        widgetRepository.save(widget);
    }

    @Override
    public Optional<Widget> findById(int id) {
        return widgetRepository.findById(id);
    }

    @Override
    public void deleteById(int id) {
        widgetRepository.deleteById(id);
    }

    @Override
    public List<Widget> findAll() {
        return widgetRepository.findAll();
    }

    @Override
    public Widget toEntity(WidgetResource widgetResource) {
        return new Widget(widgetResource);
    }

    @Override
    public WidgetResource toResource(Widget widget) {
        return new WidgetResource(widget);
    }
}
