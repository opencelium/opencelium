package io.opencelium.core.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The characters that a printed text shows as {@code ?}: the C0 controls, DEL and the C1 controls, the line feed too,
 * and the bidi controls that can show a line in reverse order. Each other character stays, also the ones next to
 * each range.
 */
class TerminalTextTest {

	@Test
	void printableReplacesEachControlCharacterWithAQuestionMark() {
		assertThat(TerminalText.printable("a\u0000b\u001Bc\u001Fd\u007Fe\u0080f\u009Fg\th\ri\nj"))
				.isEqualTo("a?b?c?d?e?f?g?h?i?j");
	}

	@Test
	void printableReplacesEachBidiControlWithAQuestionMark() {
		assertThat(TerminalText.printable("a\u202Ab\u202Bc\u202Cd\u202De\u202Ef\u2066g\u2067h\u2068i\u2069j"))
				.isEqualTo("a?b?c?d?e?f?g?h?i?j");
	}

	@Test
	void printableKeepsPlainAndNonAsciiTextUnchanged() {
		String text = "Gr\u00F6\u00DFe: 10 \u20AC [ok]\u00A0~/oc/data \u2029\u202F\u2065\u206A\u200F";

		assertThat(TerminalText.printable(text)).isEqualTo(text);
		assertThat(TerminalText.printable("")).isEmpty();
	}

}
