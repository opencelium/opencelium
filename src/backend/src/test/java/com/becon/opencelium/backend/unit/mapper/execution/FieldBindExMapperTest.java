package com.becon.opencelium.backend.unit.mapper.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.entry;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.mapper.execution.FieldBindExMapper;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for how {@link FieldBindExMapper} reads the args of an enhancement, the text the
 * workflow editor sends as {@code expertVar}: one {@code //var NAME = reference;} per arg.
 *
 * <p>Run with: ./gradlew test --tests "*.FieldBindExMapperTest"
 */
@DisplayName("FieldBindExMapper — unit")
class FieldBindExMapperTest {

    private static final String ARGS = "//var RESULT_VAR = #6477AB.(request).body.$.name;\n"
            + "//var VAR_0 = #C77E7E.(response).body.$.name;";

    private final FieldBindExMapper mapper = new FieldBindExMapper();

    @Test
    void toEntityReadsArgsAndResultTargetWhenArgsEndWithSemicolon() {
        EnhancementEx enhancement = map(ARGS).getEnhance();

        assertThat(enhancement.getArgs()).containsExactly(entry("VAR_0", "#C77E7E.(response).body.$.name"));
        assertThat(enhancement.getResultRef()).isEqualTo("#6477AB.(request).body.$.name");
    }

    @ParameterizedTest(name = "{index}: args end with {0}")
    @ValueSource(strings = {"\n", "  ", "\n\n", " \n "})
    @DisplayName("toEntity — whitespace after the last ';' declares nothing and is skipped")
    void toEntitySkipsWhitespaceWhenItFollowsLastSemicolon(String trailing) {
        EnhancementEx enhancement = map(ARGS + trailing).getEnhance();

        assertThat(enhancement.getArgs()).containsExactly(entry("VAR_0", "#C77E7E.(response).body.$.name"));
        assertThat(enhancement.getResultRef()).isEqualTo("#6477AB.(request).body.$.name");
    }

    @Test
    void toEntitySkipsEmptyArgWhenArgsHoldDoubleSemicolon() {
        EnhancementEx enhancement = map("//var VAR_0 = #C77E7E.(response).body.$.name;;\n"
                + "//var VAR_1 = {{global.TEST_VAR}};").getEnhance();

        assertThat(enhancement.getArgs()).containsOnly(
                entry("VAR_0", "#C77E7E.(response).body.$.name"),
                entry("VAR_1", "{{global.TEST_VAR}}"));
    }

    @Test
    void toEntityReturnsNoArgsWhenArgsAreOnlyWhitespace() {
        EnhancementEx enhancement = map(" \n ").getEnhance();

        assertThat(enhancement.getArgs()).isEmpty();
        assertThat(enhancement.getResultRef()).isNull();
    }

    private FieldBindEx map(String args) {
        EnhancementMng enhancement = new EnhancementMng();
        enhancement.setLanguage("js");
        enhancement.setScript("RESULT_VAR = VAR_0;");
        enhancement.setArgs(args);

        FieldBindingMng binding = new FieldBindingMng();
        binding.setId("6b0537937e52075a4b71c6ec");
        binding.setEnhancement(enhancement);

        return mapper.toEntity(binding);
    }
}
