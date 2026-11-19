package com.becon.opencelium.backend.unit.database.mysql.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for the scope rule of {@link GlobalVariable}: which workflows may use a variable.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableTest"
 */
@DisplayName("GlobalVariable — unit")
class GlobalVariableTest {

    private static final long WORKFLOW = 11L;

    @Test
    void isInScopeOfReturnsTrueWhenScopeIsAll() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of())).isTrue();
    }

    @Test
    @DisplayName("isInScopeOf — a category above the workflow's own category counts")
    void isInScopeOfReturnsTrueWhenCategoryChainHoldsTarget() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES,
                GlobalVariableScopeTarget.category(3), GlobalVariableScopeTarget.category(8));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of(5L, 3L))).isTrue();
    }

    @Test
    void isInScopeOfReturnsFalseWhenCategoryIsOutsideChain() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES,
                GlobalVariableScopeTarget.category(3));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of(5L, 4L))).isFalse();
    }

    @Test
    void isInScopeOfReturnsFalseWhenWorkflowHasNoCategory() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES,
                GlobalVariableScopeTarget.category(3));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of())).isFalse();
    }

    @Test
    void isInScopeOfReturnsTrueWhenWorkflowIsListed() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS,
                GlobalVariableScopeTarget.workflow(7), GlobalVariableScopeTarget.workflow(WORKFLOW));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of())).isTrue();
    }

    @Test
    void isInScopeOfReturnsFalseWhenWorkflowIsNotListed() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS,
                GlobalVariableScopeTarget.workflow(7));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of())).isFalse();
    }

    @Test
    @DisplayName("isInScopeOf — a category id that equals the workflow id is not the workflow")
    void isInScopeOfReturnsFalseWhenOnlyCategoryTargetHasSameId() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS,
                GlobalVariableScopeTarget.category(WORKFLOW));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of(WORKFLOW))).isFalse();
    }

    @Test
    @DisplayName("isInScopeOf — a workflow id that equals a category id is not the category")
    void isInScopeOfReturnsFalseWhenOnlyWorkflowTargetHasCategoryId() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES,
                GlobalVariableScopeTarget.workflow(3));

        assertThat(variable.isInScopeOf(WORKFLOW, Set.of(3L))).isFalse();
    }

    private static GlobalVariable aVariableScopedTo(GlobalVariableScopeType type, GlobalVariableScopeTarget... targets) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "tenants", "1");
        variable.setScopeType(type);
        variable.getScopeTargets().addAll(Set.of(targets));
        return variable;
    }
}
