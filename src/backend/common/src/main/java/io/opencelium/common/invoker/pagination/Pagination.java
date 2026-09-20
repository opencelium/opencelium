package io.opencelium.common.invoker.pagination;

import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * The paging rules of one operation.
 *
 * @param rules at least one rule, and no more than one per {@link PageParam}
 */
public record Pagination(List<PageRule> rules) {

    public Pagination {
        Objects.requireNonNull(rules, "pagination rules must not be null");
        rules = List.copyOf(rules);
        if (rules.isEmpty()) {
            throw new IllegalArgumentException("pagination must contain at least one rule");
        }
        Set<PageParam> seen = EnumSet.noneOf(PageParam.class);
        for (PageRule rule : rules) {
            if (!seen.add(rule.param())) {
                throw new IllegalArgumentException("pagination parameter '" + rule.param().value()
                        + "' has more than one rule");
            }
        }
    }

    public static Pagination of(PageRule... rules) {
        return new Pagination(List.of(rules));
    }
}
