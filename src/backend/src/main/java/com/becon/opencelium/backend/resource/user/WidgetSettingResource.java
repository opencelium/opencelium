package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.database.mysql.entity.WidgetSetting;
import jakarta.annotation.Resource;

@Resource
public class WidgetSettingResource {

    private int widgetSettingId;
    private int widgetId;
    private String i;
    private int x;
    private int y;
    private int w;
    private int h;
    private int minW;
    private int minH;

    public WidgetSettingResource() {
    }

    public WidgetSettingResource(WidgetSetting widgetSetting) {
        this.widgetSettingId = widgetSetting.getId();
        this.widgetId = widgetSetting.getWidget().getId();
        this.i = widgetSetting.getWidget().getName();
        this.x = widgetSetting.getAxisX();
        this.y = widgetSetting.getAxisY();
        this.w = widgetSetting.getWidth();
        this.h = widgetSetting.getHeight();
        this.minW = widgetSetting.getMinWidth();
        this.minH = widgetSetting.getMinHeight();
    }

    public int getWidgetId() {
        return widgetId;
    }

    public void setWidgetId(int widgetId) {
        this.widgetId = widgetId;
    }

    public String getI() {
        return i;
    }

    public void setI(String i) {
        this.i = i;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }

    public int getW() {
        return w;
    }

    public void setW(int w) {
        this.w = w;
    }

    public int getH() {
        return h;
    }

    public void setH(int h) {
        this.h = h;
    }

    public int getMinW() {
        return minW;
    }

    public void setMinW(int minW) {
        this.minW = minW;
    }

    public int getMinH() {
        return minH;
    }

    public void setMinH(int minH) {
        this.minH = minH;
    }

    public int getWidgetSettingId() {
        return widgetSettingId;
    }

    public void setWidgetSettingId(int widgetSettingId) {
        this.widgetSettingId = widgetSettingId;
    }
}
