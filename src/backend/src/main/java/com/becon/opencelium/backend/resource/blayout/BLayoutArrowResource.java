package com.becon.opencelium.backend.resource.blayout;

import com.becon.opencelium.backend.mysql.entity.BLarrow;

import java.util.List;

public class BLayoutArrowResource {
    private int from;
    private int to;

    public BLayoutArrowResource() {
    }

    public BLayoutArrowResource(BLarrow bLarrow) {
        this.from = bLarrow.getFrom();
        this.to = bLarrow.getTo();
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
}
