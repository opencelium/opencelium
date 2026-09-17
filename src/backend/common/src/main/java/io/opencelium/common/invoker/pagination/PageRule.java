package io.opencelium.common.invoker.pagination;

import org.jspecify.annotations.Nullable;

import java.util.Objects;

/**
 * What to do with one pagination parameter.
 *
 * <p>A rule needs a {@code value}, a {@code ref}, or both. A rule with neither could never supply or
 * find anything, so it is rejected. Beyond that, which combinations make sense depends on the API's
 * paging style and is left to the pager: an incrementing offset is typically a literal start value,
 * while a cursor is read from each response and written back into the next request.
 *
 * @param param  the parameter this rule governs
 * @param action what to do with it between requests
 * @param value  a literal value, such as a page size or start offset; {@code null} if not used
 * @param ref    where in the response to find the value, for example
 *               {@code response.body.$.meta.total}; {@code null} if not used
 */
public record PageRule(PageParam param, PageAction action, @Nullable String value, @Nullable String ref) {

    public PageRule {
        Objects.requireNonNull(param, "pagination parameter must not be null");
        Objects.requireNonNull(action, "action of pagination rule '" + param.value() + "' must not be null");
        if (value == null && ref == null) {
            throw new IllegalArgumentException("pagination rule '" + param.value()
                    + "' needs a value, a ref, or both");
        }
        if (ref != null && ref.isBlank()) {
            throw new IllegalArgumentException("ref of pagination rule '" + param.value() + "' must not be blank");
        }
    }

    /** A rule that uses a literal value, such as {@code <limit action="write">50</limit>}. */
    public static PageRule withValue(PageParam param, PageAction action, String value) {
        return new PageRule(param, action, value, null);
    }

    /** A rule that reads from the response, such as {@code <size ref="…" action="read"/>}. */
    public static PageRule withRef(PageParam param, PageAction action, String ref) {
        return new PageRule(param, action, null, ref);
    }
}
