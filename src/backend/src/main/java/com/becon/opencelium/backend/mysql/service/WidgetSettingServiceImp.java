package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.mysql.repository.WidgetSettingRepository;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WidgetSettingServiceImp implements WidgetSettingService {

    @Autowired
    private WidgetSettingRepository widgetSettingRepository;

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
         return widgetSettingRepository.findByName(name).orElse(null);
    }

    @Override
    public void deleteByName(String name) {
        widgetSettingRepository.deleteByName(name);
    }

    @Override
    public WidgetSettingResource toResource(WidgetSetting widgetSetting) {
        return new WidgetSettingResource(widgetSetting);
    }

    @Override
    public WidgetSetting toEntity(WidgetSettingResource widgetSettingResource) {
        return new WidgetSetting(widgetSettingResource);
    }
}
