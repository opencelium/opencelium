package io.opencelium.core.setup.prompt;

import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The color check of the system console: colors only on a terminal, never when {@code NO_COLOR} has a value. On
 * Windows only Windows Terminal shows colors; the classic console prints the escape codes as text. On each other
 * platform the terminal type decides, and a dumb or unknown terminal gets plain lines.
 */
class SystemConsoleIoTest {

	private static final String LINUX = "Linux";

	private static final String MAC = "Mac OS X";

	private static final String FREEBSD = "FreeBSD";

	private static final String WINDOWS = "Windows 11";

	private static final Map<String, String> XTERM = Map.of("TERM", "xterm-256color");

	@Test
	void showsColorsReturnsTrueOnATerminalWithATermOutsideWindows() {
		assertThat(SystemConsoleIo.showsColors(true, XTERM, LINUX)).isTrue();
		assertThat(SystemConsoleIo.showsColors(true, XTERM, MAC)).isTrue();
		assertThat(SystemConsoleIo.showsColors(true, XTERM, FREEBSD)).isTrue();
	}

	@Test
	void showsColorsReturnsFalseWhenStandardOutputIsNotATerminal() {
		assertThat(SystemConsoleIo.showsColors(false, XTERM, LINUX)).isFalse();
		assertThat(SystemConsoleIo.showsColors(false, Map.of("WT_SESSION", "1"), WINDOWS)).isFalse();
	}

	@Test
	void showsColorsReturnsFalseWhenNoColorHasAValue() {
		assertThat(SystemConsoleIo.showsColors(true, Map.of("TERM", "xterm-256color", "NO_COLOR", "1"), MAC))
				.isFalse();
		assertThat(SystemConsoleIo.showsColors(true, Map.of("WT_SESSION", "1", "NO_COLOR", "yes"), WINDOWS))
				.isFalse();
	}

	@Test
	void showsColorsReturnsTrueWhenNoColorIsEmpty() {
		assertThat(SystemConsoleIo.showsColors(true, Map.of("TERM", "xterm-256color", "NO_COLOR", ""), LINUX))
				.isTrue();
	}

	@Test
	void showsColorsReturnsFalseWhenTermIsDumbOrAbsent() {
		assertThat(SystemConsoleIo.showsColors(true, Map.of("TERM", "dumb"), LINUX)).isFalse();
		assertThat(SystemConsoleIo.showsColors(true, Map.of("TERM", ""), LINUX)).isFalse();
		assertThat(SystemConsoleIo.showsColors(true, Map.of(), MAC)).isFalse();
		assertThat(SystemConsoleIo.showsColors(true, Map.of(), FREEBSD)).isFalse();
	}

	@Test
	void showsColorsReturnsTrueOnWindowsOnlyInWindowsTerminal() {
		assertThat(SystemConsoleIo.showsColors(true, Map.of("WT_SESSION", "8f3c"), WINDOWS)).isTrue();
		assertThat(SystemConsoleIo.showsColors(true, Map.of(), WINDOWS)).isFalse();
		assertThat(SystemConsoleIo.showsColors(true, Map.of("WT_SESSION", ""), WINDOWS)).isFalse();
		assertThat(SystemConsoleIo.showsColors(true, XTERM, WINDOWS)).isFalse();
	}

}
