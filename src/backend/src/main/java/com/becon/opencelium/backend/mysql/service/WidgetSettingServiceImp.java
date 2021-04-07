package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.Widget;
import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.mysql.repository.WidgetSettingRepository;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WidgetSettingServiceImp implements WidgetSettingService {

    @Autowired
    private WidgetSettingRepository widgetSettingRepository;

    @Autowired
    private WidgetServiceImp widgetServiceImp;

    @Autowired
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

    @Override
    public void deleteById(int id) {
        widgetSettingRepository.deleteById(id);
    }

    @Override
    public void saveAll(List<WidgetSetting> widgetSettings) {
        widgetSettingRepository.saveAll(widgetSettings);
    }

    @Override
    public void deleteAll() {
        widgetSettingRepository.deleteAll();
    }

    @Override
    public WidgetSettingResource toResource(WidgetSetting widgetSetting) {
        return new WidgetSettingResource(widgetSetting);
    }

    @Override
    public WidgetSetting toEntity(WidgetSettingResource widgetSettingResource, int userId) {
        Widget widget = widgetServiceImp.findById(widgetSettingResource.getWidgetId())
                .orElseThrow(() -> new RuntimeException("Widget not found"));
        User  user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("Widget not found"));
        return new WidgetSetting(widgetSettingResource, widget, user);
    }

    @Override
    public List<WidgetSetting> findByUserId(int id) {
        return widgetSettingRepository.findByUserId(id);
    }
}
