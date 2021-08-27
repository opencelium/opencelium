package com.becon.opencelium.backend.mysql.entity;

import javax.persistence.*;

@Entity
@Table(name = "bl_arrows")
public class BLayoutArrow {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "from")
    private int from;

    @Column(name = "to")
    private int to;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_layout_id")
    private BusinessLayout bLayout;

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
