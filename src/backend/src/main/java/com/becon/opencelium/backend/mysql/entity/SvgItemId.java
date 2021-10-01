package com.becon.opencelium.backend.mysql.entity;

import java.io.Serializable;

public class SvgItemId implements Serializable {

    private int from;
    private int to;

    public SvgItemId() {
    }

    public SvgItemId(int from, int to) {
        this.from = from;
        this.to = to;
    }
}
