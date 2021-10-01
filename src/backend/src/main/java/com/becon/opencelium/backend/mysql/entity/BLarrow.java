package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.blayout.BLayoutArrowResource;
import com.becon.opencelium.backend.resource.blayout.BLayoutSvgItemResource;

import javax.persistence.*;

@Entity
@Table(name = "bl_arrows")
public class BLarrow {

    @Id
    private int id;

    @Column(name = "arr_from")
    private int from;

    @Column(name = "arr_to")
    private int to;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_layout_id")
    private BusinessLayout bLayout;

    public BLarrow() {
    }

    public BLarrow(BLayoutArrowResource arrowResource) {
        this.id = arrowResource.getId();
        this.from = arrowResource.getFrom();
        this.to = arrowResource.getTo();
    }

    public BLarrow(BLayoutArrowResource arrowResource, BusinessLayout businessLayout) {
        this.id = arrowResource.getId();
        this.from = arrowResource.getFrom();
        this.to = arrowResource.getTo();
        this.bLayout = businessLayout;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getFrom() {
        return from;
    }

    public void setFrom(int from) {
        this.from = from;
    }

    public int getTo() {
        return to;
    }

    public void setTo(int to) {
        this.to = to;
    }

    public BusinessLayout getbLayout() {
        return bLayout;
    }

    public void setbLayout(BusinessLayout bLayout) {
        this.bLayout = bLayout;
    }
}
