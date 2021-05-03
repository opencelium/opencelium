package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.mysql.entity.Widget;

import javax.annotation.Resource;
import javax.persistence.Column;

@Resource
public class WidgetResource {

    private int widgetId;
    private String i;
    private String icon;
    private String tooltipTranslationKey;

    public WidgetResource() {
    }

    public WidgetResource(Widget widget) {
        this.widgetId = widget.getId();
        this.i = widget.getName();
        this.icon = widget.getIcon();
        this.tooltipTranslationKey = widget.getTooltipTranslationKey();
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTooltipTranslationKey() {
        return tooltipTranslationKey;
    }

    public void setTooltipTranslationKey(String tooltipTranslationKey) {
        this.tooltipTranslationKey = tooltipTranslationKey;
    }
}
