package io.opencelium.common.invoker.pagination;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaginationTest {

    // ── PageRule ──────────────────────────────────────────

    @Test
    void pageRuleThrowsWhenItHasNeitherValueNorRef() {
        assertThatThrownBy(() -> new PageRule(PageParam.LIMIT, PageAction.WRITE, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("pagination rule 'limit' needs a value, a ref, or both");
    }

    @Test
    void pageRuleAcceptsBothValueAndRefWhenCursorIsReadAndWrittenBack() {
        PageRule cursor = new PageRule(PageParam.CURSOR, PageAction.WRITE, "", "response.body.$.next_cursor");

        assertThat(cursor.ref()).isEqualTo("response.body.$.next_cursor");
    }

    @Test
    void pageRuleAcceptsIncrementWhenValueComesFromARef() {
        PageRule page = PageRule.withRef(PageParam.PAGE, PageAction.INCREMENT, "response.body.$.page");

        assertThat(page.value()).isNull();
    }

    // ── Pagination ────────────────────────────────────────

    @Test
    void constructorThrowsWhenParameterHasTwoRules() {
        assertThatThrownBy(() -> Pagination.of(
                PageRule.withValue(PageParam.LIMIT, PageAction.WRITE, "50"),
                PageRule.withValue(PageParam.LIMIT, PageAction.WRITE, "100")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("pagination parameter 'limit' has more than one rule");
    }

    @Test
    void constructorThrowsWhenThereAreNoRules() {
        assertThatThrownBy(() -> new Pagination(List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("pagination must contain at least one rule");
    }

    @Test
    void ruleReturnsTheRuleForAParameter() {
        PageRule limit = PageRule.withValue(PageParam.LIMIT, PageAction.WRITE, "50");
        Pagination pagination = Pagination.of(limit, PageRule.withValue(PageParam.OFFSET, PageAction.INCREMENT, "0"));

        assertThat(pagination.rule(PageParam.LIMIT)).contains(limit);
        assertThat(pagination.rule(PageParam.CURSOR)).isEmpty();
    }

    @Test
    void pageParamFromValueResolvesUnderscoredNamesIgnoringCase() {
        assertThat(PageParam.fromValue("HAS_MORE")).isEqualTo(PageParam.HAS_MORE);
    }
}
