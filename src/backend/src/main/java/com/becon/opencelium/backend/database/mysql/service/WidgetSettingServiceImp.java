package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.Widget;
import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.database.mysql.repository.WidgetSettingRepository;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WidgetSettingServiceImp implements WidgetSettingService {

    @Autowired
    private WidgetSettingRepository widgetSettingRepository;

    @Autowired
    private WidgetServiceImp widgetServiceImp;

    @Autowired
    @Lazy
    private UserServiceImpl userService;

    @Override
    public void create(WidgetSetting widgetSetting) {
         widgetSettingRepository.save(widgetSetting);
    }

    @Override
    public void update(WidgetSetting widgetSetting) {
        widgetSettingRepository.save(widgetSetting);
    }

    @Override
    public WidgetSetting findByName(String name) {
//         return widgetSettingRepository.findByName(name).orElse(null);
        return null;
    }

    @Override
    public void deleteByName(String name) {
//        widgetSettingRepository.deleteByName(name);
    }

    @Override
    public List<WidgetSetting> findAll() {
        return widgetSettingRepository.findAll();
    }

    @Override
    public WidgetSetting findById(int id) {
        return widgetSettingRepository.findById(id).orElseThrow(() -> new RuntimeException("WidgetNotFound"));
    }

    @Transactional
    @Override
    public void deleteById(int id) {
        widgetSettingRepository.deleteById(id);
    }

    @Override
    public void saveAll(List<WidgetSetting> widgetSettings) {
        widgetSettingRepository.saveAll(widgetSettings);
    }

    @Transactional
    @Override
    public void deleteAll() {
        widgetSettingRepository.deleteAll();
    }

    @Override
    public List<WidgetSetting> findAllByUserId(int id) {
        return widgetSettingRepository.findByUserId(id);
    }

    @Override
    public WidgetSettingResource toResource(WidgetSetting widgetSetting) {
        return new WidgetSettingResource(widgetSetting);
    }

    @Override
    public WidgetSetting toEntity(WidgetSettingResource widgetSettingResource, int userId) {
        Widget widget = widgetServiceImp.findById(widgetSettingResource.getWidgetId())
                .orElseThrow(() -> new RuntimeException("Widget not found"));
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("Widget not found"));
        return new WidgetSetting(widgetSettingResource, widget, user);
    }

    @Override
    public List<WidgetSetting> findByUserId(int id) {
        return widgetSettingRepository.findByUserId(id);
    }
}
