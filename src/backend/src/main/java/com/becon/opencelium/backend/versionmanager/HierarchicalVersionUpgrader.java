package com.becon.opencelium.backend.versionmanager;

import com.becon.opencelium.backend.versionmanager.base.Utils;

import java.util.*;
import java.util.function.UnaryOperator;

public final class HierarchicalVersionUpgrader<T> {

    private final NavigableMap<String, UnaryOperator<T>> steps;

    private HierarchicalVersionUpgrader(NavigableMap<String, UnaryOperator<T>> steps) {
        // Make immutable TreeMap with comparator preserved
        this.steps = Collections.unmodifiableNavigableMap(new TreeMap<>(steps));
    }

    public static <T> Builder<T> builder() {
        return new Builder<>();
    }

    /** Apply only steps with version > oldVersion */
    public T upgradeFromVersion(T input, String oldVersion) {
        T cur = input;

        for (UnaryOperator<T> op : steps.tailMap(oldVersion, false).values()) {
            cur = op.apply(cur);
        }

        return cur;
    }

    public static final class Builder<T> {

        private final NavigableMap<String, UnaryOperator<T>> steps =
                new TreeMap<>(Utils::compare);

        public Builder<T> step(String version, UnaryOperator<T> operator) {
            steps.put(version, operator);
            return this;
        }

        public HierarchicalVersionUpgrader<T> build() {
            return new HierarchicalVersionUpgrader<>(steps);
        }
    }
}
