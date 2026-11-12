package io.opencelium.core.config;

import java.util.OptionalInt;

/**
 * Text for a terminal, with each control character as {@code ?}: the characters U+0000 to U+001F (the line feed
 * too), U+007F, U+0080 to U+009F, and the bidi controls U+202A to U+202E and U+2066 to U+2069. A text from outside
 * OpenCelium, for example the error message of a server or a value of the setup file, then cannot move the cursor,
 * clear the screen, change the colors or show a line in reverse order. The start of the application and the setup
 * wizard share this one rule. A caller that prints a text with line breaks of its own splits it at the line feeds
 * first.
 */
public final class TerminalText {

	/** In the place of a control character: plain, and 1 character for 1, so the padding of a label stays right. */
	private static final char REPLACEMENT = '?';

	/** The embeddings and overrides: left-to-right, right-to-left, pop. */
	private static final char FIRST_BIDI_EMBEDDING = '\u202A';

	private static final char LAST_BIDI_EMBEDDING = '\u202E';

	/** The isolates: left-to-right, right-to-left, first strong, pop. */
	private static final char FIRST_BIDI_ISOLATE = '\u2066';

	private static final char LAST_BIDI_ISOLATE = '\u2069';

	private TerminalText() {
	}

	public static String printable(String text) {
		char[] chars = text.toCharArray();
		for (int i = 0; i < chars.length; i++) {
			if (isControl(chars[i])) {
				chars[i] = REPLACEMENT;
			}
		}
		return new String(chars);
	}

	/** The first control character of {@code text}, as its code; empty when the text has none. */
	public static OptionalInt firstControl(String text) {
		return text.chars().filter(c -> isControl((char) c)).findFirst();
	}

	private static boolean isControl(char c) {
		return Character.isISOControl(c) || c >= FIRST_BIDI_EMBEDDING && c <= LAST_BIDI_EMBEDDING
				|| c >= FIRST_BIDI_ISOLATE && c <= LAST_BIDI_ISOLATE;
	}

}
