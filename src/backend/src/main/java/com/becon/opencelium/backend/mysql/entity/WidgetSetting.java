package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "widget_setting")
public class WidgetSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private int id;

    @Column(name = "name", unique = true)
    private String name;

    @Column(name = "x_axis")
    private int axisX;

    @Column(name = "y_axis")
    private int axisY;

    @Column(name = "width")
    private int width;

    @Column(name = "height")
    private int height;

    @Column(name = "min_width")
    private int minWidth;

    @Column(name = "min_height")
    private int minHeight;

    @JsonIgnore
    @ManyToMany(mappedBy = "widgetSettings")
    private List<User> user = new ArrayList<>();

    public WidgetSetting() {
    }

    public WidgetSetting(WidgetSettingResource widgetSettingResource) {
        this.id = widgetSettingResource.getWidgetId();
        this.name = widgetSettingResource.getI();
        this.axisX = widgetSettingResource.getX();
        this.axisY = widgetSettingResource.getY();
        this.width = widgetSettingResource.getW();
        this.height = widgetSettingResource.getH();
        this.minWidth = widgetSettingResource.getMinW();
        this.minHeight = widgetSettingResource.getMinH();
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

    public int getAxisX() {
        return axisX;
    }

    public void setAxisX(int axisX) {
        this.axisX = axisX;
    }

    public int getAxisY() {
        return axisY;
    }

    public void setAxisY(int axisY) {
        this.axisY = axisY;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getMinWidth() {
        return minWidth;
    }

    public void setMinWidth(int minWidth) {
        this.minWidth = minWidth;
    }

    public int getMinHeight() {
        return minHeight;
    }

    public void setMinHeight(int minHeight) {
        this.minHeight = minHeight;
    }

    public List<User> getUser() {
        return user;
    }

    public void setUser(List<User> user) {
        this.user = user;
    }
}
