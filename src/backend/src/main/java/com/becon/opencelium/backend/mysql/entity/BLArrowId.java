package com.becon.opencelium.backend.mysql.entity;

import java.io.Serializable;

public class BLArrowId implements Serializable {

    private int from;
    private int to;

    public BLArrowId() {
    }

    public BLArrowId(int from, int to) {
        this.from = from;
        this.to = to;
    }
}
