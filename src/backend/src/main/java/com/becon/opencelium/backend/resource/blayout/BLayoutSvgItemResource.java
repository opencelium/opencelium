package com.becon.opencelium.backend.resource.blayout;

import com.becon.opencelium.backend.database.mysql.entity.BLsvgItem;

import java.util.Arrays;
import java.util.List;

public class BLayoutSvgItemResource {
    private int id;
    private String name;
    private int x;
    private int y;
    private List<String> items;

    public BLayoutSvgItemResource() {
    }

    public BLayoutSvgItemResource(BLsvgItem bLsvgItem) {
        this.id = bLsvgItem.getId();
        this.name = bLsvgItem.getName();
        this.x = bLsvgItem.getAxisX();
        this.y = bLsvgItem.getAxisY();
        this.items = Arrays.asList(bLsvgItem.getItems().split(","));
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

    public List<String> getItems() {
        return items;
    }

    public void setItems(List<String> items) {
        this.items = items;
    }
}
