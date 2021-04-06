package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.mysql.entity.WidgetSetting;

import javax.annotation.Resource;
import java.util.List;

@Resource
public class UserWidgetsResource {

    private int userId;
    List<WidgetSettingResource> widgetSettings;

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public List<WidgetSettingResource> getWidgetSettings() {
        return widgetSettings;
    }

    public void setWidgetSettings(List<WidgetSettingResource> widgetSettings) {
        this.widgetSettings = widgetSettings;
    }
}
