package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.user.WidgetResource;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "widget")
public class Widget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private int id;

    @Column(name = "name", unique = true)
    private String name;

    @Column(name = "icon")
    private String icon;

    @Column(name = "tooltipTranslationKey")
    private String tooltipTranslationKey;

    @OneToMany(mappedBy = "widget", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<WidgetSetting> widgetSettings = new ArrayList<>();

    public Widget() {
    }

    public Widget(WidgetResource widgetResource) {
        this.id = widgetResource.getWidgetId();
        this.name = widgetResource.getI();
        this.icon = widgetResource.getIcon();
        this.tooltipTranslationKey = widgetResource.getTooltipTranslationKey();
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

    public List<WidgetSetting> getWidgetSettings() {
        return widgetSettings;
    }

    public void setWidgetSettings(List<WidgetSetting> widgetSettings) {
        this.widgetSettings = widgetSettings;
    }
}
