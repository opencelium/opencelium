package io.opencelium.core.setup.mongo;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The progress of {@code docker compose --progress json pull}, from its output lines: 1 JSON event on each line.
 * Docker gives the size of a layer only when the download of that layer starts, and a small layer gives no size, so
 * the total grows while the first layers start. A line that is not a JSON event, for example a warning of Docker
 * Compose, changes nothing.
 * <p>
 * Only a {@code Downloading} event moves a layer: the unpack after the download gives a current value too, but of
 * another unit. A {@code Done} event of a layer with a size counts that layer as complete.
 */
final class PullProgress {

	private static final String DOWNLOADING = "Downloading";

	private static final String DONE = "Done";

	/** The layers that gave a size, by their ID. */
	private final Map<String, Layer> layers = new HashMap<>();

	private Optional<String> error = Optional.empty();

	/** Takes 1 line of the output. */
	void accept(String line) {
		JsonNode event;
		try {
			event = JsonMapper.shared().readTree(line);
		}
		catch (JacksonException ex) {
			// Not an event: a warning, a cut line, or the message of a Docker Compose without JSON progress.
			return;
		}
		if (event == null || !event.isObject()) {
			return;
		}
		if (event.path("error").asBoolean(false)) {
			error = Optional.of(printable(event.path("message").asString("no message")));
			return;
		}
		String id = event.path("id").asString("");
		if (DOWNLOADING.equals(event.path("text").asString(""))) {
			long total = event.path("total").asLong(0);
			if (total > 0) {
				layers.put(id, new Layer(Math.clamp(event.path("current").asLong(0), 0, total), total));
			}
		}
		else if (DONE.equals(event.path("status").asString(""))) {
			layers.computeIfPresent(id, (key, layer) -> new Layer(layer.total(), layer.total()));
		}
	}

	/** The bytes downloaded so far, over the layers with a known size. */
	long done() {
		return layers.values().stream().mapToLong(Layer::done).sum();
	}

	/** The sizes of the layers known so far, in bytes. */
	long total() {
		return layers.values().stream().mapToLong(Layer::total).sum();
	}

	/**
	 * The message of an error event: the cause from Docker why the download failed. Docker relays the text of the
	 * registry, so each control character in it is a space: an escape sequence cannot change the terminal.
	 */
	Optional<String> error() {
		return error;
	}

	private static String printable(String text) {
		return text.codePoints().map(c -> Character.isISOControl(c) ? ' ' : c)
				.collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();
	}

	private record Layer(long done, long total) {
	}

}
