package com.becon.opencelium.backend.flowchart;

public class PairWeight<L, R> implements Weight {
    private L left;
    private R right;

    public static <L, R> PairWeight<L, R> of(L left, R right) {
        return new PairWeight<>(left, right);
    }

    public PairWeight(L left, R right) {
        this.left = left;
        this.right = right;
    }

    public L getLeft() {
        return left;
    }

    public void setLeft(L left) {
        this.left = left;
    }

    public R getRight() {
        return right;
    }

    public void setRight(R right) {
        this.right = right;
    }

    @Override
    public String serialize() {
        if (this.left == null) {
            return this.right == null ? null : this.right.toString();
        }
        if (this.right == null) {
            return this.left.toString();
        }

        return this.left + " -> " + this.right;
    }
}
