package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;

@Entity
@Table(name = "bl_items")
public class BLayoutItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_layout_id")
    private BusinessLayout bLayout;

    public BusinessLayout getbLayout() {
        return bLayout;
    }

    public void setbLayout(BusinessLayout bLayout) {
        this.bLayout = bLayout;
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
}
