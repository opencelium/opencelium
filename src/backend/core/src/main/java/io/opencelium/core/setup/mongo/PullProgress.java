package io.opencelium.core.setup.mongo;

import java.util.Optional;

/**
 * The progress of {@code docker compose --progress json pull}, from its output lines: 1 JSON event on each line.
 * Docker gives the size of a layer only when the download of that layer starts, and a small layer gives no size, so
 * the total grows while the first layers start. A line that is not a JSON event, for example a warning of Docker
 * Compose, changes nothing.
 */
final class PullProgress {

	/** Takes 1 line of the output. */
	void accept(String line) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The bytes downloaded so far, over the layers with a known size. */
	long done() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The sizes of the layers known so far, in bytes. */
	long total() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The message of an error event: the cause from Docker why the download failed. */
	Optional<String> error() {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
