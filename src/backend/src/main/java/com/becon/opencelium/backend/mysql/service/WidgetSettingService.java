package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;

import java.util.List;

public interface WidgetSettingService {

    void create(WidgetSetting widgetSetting);
    void update(WidgetSetting widgetSetting);
    WidgetSetting findByName(String name);
    WidgetSetting findById(int id);
    void deleteByName(String name);
    void deleteById(int id);
    List<WidgetSetting> findAll();
    WidgetSettingResource toResource(WidgetSetting widgetSetting);
    WidgetSetting toEntity(WidgetSettingResource widgetSettingResource, int userId);

    List<WidgetSetting> findByUserId(int id);
}
