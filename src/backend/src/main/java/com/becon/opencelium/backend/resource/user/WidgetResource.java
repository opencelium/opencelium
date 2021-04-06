package com.becon.opencelium.backend.resource.user;

import com.becon.opencelium.backend.mysql.entity.Widget;

import javax.annotation.Resource;
import javax.persistence.Column;

@Resource
public class WidgetResource {

    private int id;
    private String name;
    private String icon;
    private String tooltipTranslationKey;

    public WidgetResource() {
    }

    public WidgetResource(Widget widget) {
        this.name = widget.getName();
        this.icon = widget.getIcon();
        this.tooltipTranslationKey = widget.getTooltipTranslationKey();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
