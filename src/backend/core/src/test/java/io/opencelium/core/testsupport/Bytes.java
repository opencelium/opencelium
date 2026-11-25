package io.opencelium.core.testsupport;

import java.util.Arrays;

/** A search for a byte sequence, for a test that looks for a plaintext in stored bytes. */
public final class Bytes {

	private Bytes() {
	}

	/** @return {@code true} when {@code part} occurs in {@code bytes} */
	public static boolean contains(byte[] bytes, byte[] part) {
		for (int start = 0; start + part.length <= bytes.length; start++) {
			if (Arrays.equals(bytes, start, start + part.length, part, 0, part.length)) {
				return true;
			}
		}
		return false;
	}

}
