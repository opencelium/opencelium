package io.opencelium.core.settings;

import java.net.InetAddress;
import java.util.regex.Pattern;

import io.opencelium.core.config.TerminalText;

/**
 * The type of a runtime setting: it gives the JSON form of the value in the settings API, and the rule for a valid
 * value with the bounds of the setting definition. A value of another JSON type is not valid, for example the JSON
 * string {@code "5672"} for an integer.
 */
public enum SettingType {

	/**
	 * A JSON string with a number of characters inside the bounds and without a control character: the rule of
	 * {@link TerminalText}, which the start of core and the setup wizard share. A later feature sends such a value to
	 * another system or shows it in a log line, where a line feed, a NUL or a bidi control can forge a line or change
	 * the meaning of the text.
	 */
	TEXT,

	/** A JSON number without a fraction, inside the bounds. */
	INTEGER,

	/**
	 * A JSON string with a host name or an IP address, with a number of characters inside the bounds. The rule examines
	 * the form of the text only and does no DNS lookup:
	 * <ul>
	 * <li>A host name has labels of 1 to 63 letters, digits and hyphens, and a label does not start or end with a
	 * hyphen.</li>
	 * <li>A text whose last label is all digits is an IPv4 address of 4 numbers from 0 to 255.</li>
	 * <li>An IPv6 address has no brackets and no zone.</li>
	 * </ul>
	 */
	HOST,

	/** A JSON string with the rule of {@link #TEXT}. The secret storage keeps the value, and a read shows a mask. */
	SECRET;

	private static final Pattern HOST_NAME_LABEL = Pattern.compile("[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?");

	private static final Pattern DIGITS = Pattern.compile("[0-9]+");

	private static final Pattern IPV4_PART = Pattern.compile("25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]");

	/**
	 * @param value a value from the settings API, never {@code null}
	 * @param min   the lower bound of the setting definition
	 * @param max   the upper bound of the setting definition
	 * @return {@code true} when the value has the JSON form of this type and is inside the bounds
	 */
	boolean validate(Object value, int min, int max) {
		return switch (this) {
			case TEXT -> value instanceof String text && inside(text.length(), min, max)
					&& TerminalText.firstControl(text).isEmpty();
			case INTEGER -> isWholeNumber(value) && inside(((Number) value).longValue(), min, max);
			case HOST -> value instanceof String host && inside(host.length(), min, max)
					&& (isHostName(host) || isIpv6Address(host));
			case SECRET -> throw new UnsupportedOperationException("not implemented yet");
		};
	}

	private static boolean inside(long value, int min, int max) {
		return value >= min && value <= max;
	}

	/** A JSON number without a fraction: the JSON parser gives an integer type for it, and a decimal type else. */
	private static boolean isWholeNumber(Object value) {
		return value instanceof Integer || value instanceof Long || value instanceof Short || value instanceof Byte;
	}

	/**
	 * A host name, or an IPv4 address in the dotted form of 4 numbers from 0 to 255. The last label of a host name is
	 * not all digits, so a text whose last label is all digits must be an IPv4 address.
	 */
	private static boolean isHostName(String host) {
		String[] labels = host.split("\\.", -1);
		for (String label : labels) {
			if (!HOST_NAME_LABEL.matcher(label).matches()) {
				return false;
			}
		}
		return !DIGITS.matcher(labels[labels.length - 1]).matches() || isIpv4Address(labels);
	}

	private static boolean isIpv4Address(String[] labels) {
		if (labels.length != 4) {
			return false;
		}
		for (String label : labels) {
			if (!IPV4_PART.matcher(label).matches()) {
				return false;
			}
		}
		return true;
	}

	/**
	 * An IPv6 address without brackets and without a zone. The literal parser of the JDK reads the text only and does
	 * no DNS lookup, but it accepts brackets and a zone that names a network interface of the host that parses it: such
	 * a value can be valid on 1 core instance and not valid on another.
	 */
	private static boolean isIpv6Address(String host) {
		if (host.indexOf(':') < 0 || host.indexOf('[') >= 0 || host.indexOf('%') >= 0) {
			return false;
		}
		try {
			InetAddress.ofLiteral(host);
			return true;
		}
		catch (IllegalArgumentException ex) {
			return false;
		}
	}

}
