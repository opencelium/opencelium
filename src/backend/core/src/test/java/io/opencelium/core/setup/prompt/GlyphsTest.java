package io.opencelium.core.setup.prompt;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The symbol set follows the console charset: Unicode on a UTF console, ASCII elsewhere. */
class GlyphsTest {

	@Test
	void utfConsolesGetTheUnicodeSet() {
		assertThat(Glyphs.forCharset(StandardCharsets.UTF_8)).isEqualTo(Glyphs.UNICODE);
		assertThat(Glyphs.forCharset(StandardCharsets.UTF_16)).isEqualTo(Glyphs.UNICODE);
	}

	@Test
	void otherConsolesGetTheAsciiSet() {
		assertThat(Glyphs.forCharset(StandardCharsets.US_ASCII)).isEqualTo(Glyphs.ASCII);
		assertThat(Glyphs.forCharset(StandardCharsets.ISO_8859_1)).isEqualTo(Glyphs.ASCII);
		assertThat(Glyphs.forCharset(Charset.forName("windows-1252"))).isEqualTo(Glyphs.ASCII);
	}

	@Test
	void everySymbolOfTheAsciiSetIsAscii() {
		for (String symbol : Glyphs.ASCII.all()) {
			assertThat(symbol.chars()).allMatch(c -> c < 128);
		}
	}

}
