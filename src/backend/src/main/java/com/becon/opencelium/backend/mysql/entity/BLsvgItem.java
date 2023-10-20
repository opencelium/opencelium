package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.blayout.BLayoutSvgItemResource;

import jakarta.persistence.*;

@Entity
@Table(name = "bl_svg_items")
public class BLsvgItem {
    @Id
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "x_axis")
    private int axisX;

    @Column(name = "y_axis")
    private int axisY;

    @Column(name = "items")
    private String items;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_layout_id")
    private BusinessLayout bLayout;

    public BLsvgItem() {
    }

    public BLsvgItem(BLayoutSvgItemResource svgItemResource) {
        this.id = svgItemResource.getId();
        this.name = svgItemResource.getName();
        this.axisX = svgItemResource.getX();
        this.axisY = svgItemResource.getY();
        StringBuilder b = new StringBuilder();
        svgItemResource.getItems().forEach(s -> b.append(s).append(","));
        b.deleteCharAt(b.length() - 1);
        this.items = b.toString();
    }

    public BLsvgItem(BLayoutSvgItemResource svgItemResource, BusinessLayout businessLayout) {
        this.id = svgItemResource.getId();
        this.name = svgItemResource.getName();
        this.axisX = svgItemResource.getX();
        this.axisY = svgItemResource.getY();
        StringBuilder b = new StringBuilder();
        svgItemResource.getItems().forEach(s -> b.append(s).append(","));
        b.deleteCharAt(b.length() - 1);
        this.items = b.toString();
        this.bLayout = businessLayout;
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

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public BusinessLayout getbLayout() {
        return bLayout;
    }

    public void setbLayout(BusinessLayout bLayout) {
        this.bLayout = bLayout;
    }
}
