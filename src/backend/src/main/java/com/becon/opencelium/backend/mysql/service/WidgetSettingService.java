package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;
import com.becon.opencelium.backend.resource.user.WidgetSettingResource;

public interface WidgetSettingService {

    void create(WidgetSetting widgetSetting);
    void update(WidgetSetting widgetSetting);
    WidgetSetting findByName(String name);
    void deleteByName(String name);
    WidgetSettingResource toResource(WidgetSetting widgetSetting);
    WidgetSetting toEntity(WidgetSettingResource widgetSettingResource);

}
