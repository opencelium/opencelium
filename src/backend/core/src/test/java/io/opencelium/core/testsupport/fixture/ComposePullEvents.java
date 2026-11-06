package io.opencelium.core.testsupport.fixture;

/**
 * Output lines of {@code docker compose --progress json pull} for the image {@code mongo:8}: 1 JSON event on each
 * line, in the form that a real pull prints. A layer event names its parent image; only a layer that downloads gives
 * its size, and an event with the status {@code Done} gives none.
 */
public final class ComposePullEvents {

	private ComposePullEvents() {
	}

	/** The start of the pull of the image. */
	public static String pulling() {
		return """
				{"id":"Image mongo:8","status":"Working","text":"Pulling"}""";
	}

	/** A layer before its download starts: no size yet. */
	public static String waiting(String layer) {
		return """
				{"id":"%s","parent_id":"Image mongo:8","status":"Working","text":"Pulling fs layer","details":"0B"}"""
				.formatted(layer);
	}

	/** A layer that has {@code current} of its {@code total} bytes. */
	public static String downloading(String layer, long current, long total) {
		return """
				{"id":"%s","parent_id":"Image mongo:8","status":"Working","text":"Downloading","details":"",\
				"current":%d,"total":%d,"percent":%d}"""
				.formatted(layer, current, total, current * 100 / total);
	}

	/** A layer whose download is complete; the event gives no size. */
	public static String downloadComplete(String layer) {
		return """
				{"id":"%s","parent_id":"Image mongo:8","status":"Done","text":"Download complete","details":"0B",\
				"percent":100}"""
				.formatted(layer);
	}

	/** A layer that is unpacked after its download: the event gives a current value and no size. */
	public static String extracting(String layer) {
		return """
				{"id":"%s","parent_id":"Image mongo:8","status":"Working","text":"Extracting","details":"1B",\
				"current":1}"""
				.formatted(layer);
	}

	/** A layer that is downloaded and unpacked; the event gives no size. */
	public static String pullComplete(String layer) {
		return """
				{"id":"%s","parent_id":"Image mongo:8","status":"Done","text":"Pull complete","details":"0B",\
				"percent":100}"""
				.formatted(layer);
	}

	/** The end of the pull of the image. */
	public static String pulled() {
		return """
				{"id":"Image mongo:8","status":"Done","text":"Pulled"}""";
	}

	/** The event of a failed pull; {@code message} has no quote and no backslash. */
	public static String error(String message) {
		return """
				{"error":true,"message":"%s"}""".formatted(message);
	}

}
