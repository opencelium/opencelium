package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "business_layout")
public class BusinessLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "x_axis")
    private int axisX;

    @Column(name = "y_axis")
    private int axisY;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<BLayoutItem> items;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<BLayoutArrow> arrows;

    @OneToOne
    @JoinColumn(name = "connection_id")
    private Connection connection;

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

    public Set<BLayoutItem> getItems() {
        return items;
    }

    public void setItems(Set<BLayoutItem> items) {
        this.items = items;
    }

    public Set<BLayoutArrow> getArrows() {
        return arrows;
    }

    public void setArrows(Set<BLayoutArrow> arrows) {
        this.arrows = arrows;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }
}
