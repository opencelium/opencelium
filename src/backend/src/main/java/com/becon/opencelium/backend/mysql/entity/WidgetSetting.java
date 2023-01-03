package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.user.WidgetSettingResource;
import jakarta.persistence.*;

@Entity
@Table(name = "widget_setting")
public class WidgetSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "widget_id")
    private Widget widget;

    public WidgetSetting() {
    }

    public WidgetSetting(WidgetSettingResource widgetSettingResource, Widget widget, User user) {
        this.id = widgetSettingResource.getWidgetSettingId();
        this.axisX = widgetSettingResource.getX();
        this.axisY = widgetSettingResource.getY();
        this.width = widgetSettingResource.getW();
        this.height = widgetSettingResource.getH();
        this.minWidth = widgetSettingResource.getMinW();
        this.minHeight = widgetSettingResource.getMinH();
        this.widget = widget;
        this.user = user;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Widget getWidget() {
        return widget;
    }

    public void setWidget(Widget widget) {
        this.widget = widget;
    }
}
