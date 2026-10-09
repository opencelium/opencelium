package io.opencelium.core.setup.prompt;

import java.nio.charset.Charset;
import java.util.List;
import java.util.Locale;

/**
 * The symbols of the setup screens. A console that is not UTF-8 (a server with the C locale, an old Windows code
 * page) would print every non-ASCII symbol as a question mark, so such a console gets the ASCII set instead. A
 * status symbol is at most 2 characters wide; the prompter pads it to one column.
 */
public enum Glyphs {

	UNICODE("ℹ", "✖", "✔", "▸", "❯", "─", "│", "╭", "╮", "╰", "╯", "├─", "└─"),

	ASCII("i", "x", "OK", ">", ">", "-", "|", "+", "+", "+", "+", "|-", "`-");

	private final String info;

	private final String error;

	private final String success;

	private final String progress;

	private final String prompt;

	private final String horizontal;

	private final String vertical;

	private final String topLeft;

	private final String topRight;

	private final String bottomLeft;

	private final String bottomRight;

	private final String branch;

	private final String lastBranch;

	Glyphs(String info, String error, String success, String progress, String prompt, String horizontal,
			String vertical, String topLeft, String topRight, String bottomLeft, String bottomRight, String branch,
			String lastBranch) {
		this.info = info;
		this.error = error;
		this.success = success;
		this.progress = progress;
		this.prompt = prompt;
		this.horizontal = horizontal;
		this.vertical = vertical;
		this.topLeft = topLeft;
		this.topRight = topRight;
		this.bottomLeft = bottomLeft;
		this.bottomRight = bottomRight;
		this.branch = branch;
		this.lastBranch = lastBranch;
	}

	/** The Unicode set for a UTF console, else the ASCII set. */
	public static Glyphs forCharset(Charset charset) {
		return charset.name().toUpperCase(Locale.ROOT).startsWith("UTF") ? UNICODE : ASCII;
	}

	public String info() {
		return info;
	}

	public String error() {
		return error;
	}

	public String success() {
		return success;
	}

	public String progress() {
		return progress;
	}

	/** The mark before the cursor of a question. */
	public String prompt() {
		return prompt;
	}

	public String horizontal() {
		return horizontal;
	}

	public String vertical() {
		return vertical;
	}

	public String topLeft() {
		return topLeft;
	}

	public String topRight() {
		return topRight;
	}

	public String bottomLeft() {
		return bottomLeft;
	}

	public String bottomRight() {
		return bottomRight;
	}

	/** The mark of a list item that has a next one. */
	public String branch() {
		return branch;
	}

	public String lastBranch() {
		return lastBranch;
	}

	/** Every symbol of this set. */
	public List<String> all() {
		return List.of(info, error, success, progress, prompt, horizontal, vertical, topLeft, topRight, bottomLeft,
				bottomRight, branch, lastBranch);
	}

}
