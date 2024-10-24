package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
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
    List<WidgetSetting> findAllByUserId(int id);
    void saveAll(List<WidgetSetting> widgetSettings);
    void deleteAll();
    WidgetSettingResource toResource(WidgetSetting widgetSetting);
    WidgetSetting toEntity(WidgetSettingResource widgetSettingResource, int userId);

    List<WidgetSetting> findByUserId(int id);
}
