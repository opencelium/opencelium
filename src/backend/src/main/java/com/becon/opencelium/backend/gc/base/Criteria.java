package com.becon.opencelium.backend.gc.base;

import java.util.function.Predicate;

public class Criteria<T> {
    private final Predicate<T> predicate;

    private Criteria(Predicate<T> predicate) {
        this.predicate = predicate;
    }

    public boolean test(T t) {
        return predicate.test(t);
    }

    public static <T> CriteriaBuilder<T> builder() {
        return new CriteriaBuilder<>();
    }

    public static class CriteriaBuilder<T> {
        private Predicate<T> predicate;

        private CriteriaBuilder() {
            this.predicate = t -> true;
        }

        public Criteria<T> build() {
            return new Criteria<>(this.predicate);
        }

        public CriteriaBuilder<T> and(Predicate<T> criterion) {
            this.predicate = this.predicate.and(criterion);
            return this;
        }

        public CriteriaBuilder<T> or(Predicate<T> criterion) {
            this.predicate = this.predicate.or(criterion);
            return this;
        }

        public CriteriaBuilder<T> negate() {
            this.predicate = this.predicate.negate();
            return this;
        }
    }
}
