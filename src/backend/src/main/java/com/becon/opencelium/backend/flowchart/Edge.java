package com.becon.opencelium.backend.flowchart;

public class Edge<N, W> {
    public final N from;
    public final N to;
    public final W weight;

    public Edge(N from, N to, W weight) {
        this.from = from;
        this.to = to;
        this.weight = weight;
    }
}
