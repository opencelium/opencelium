package io.opencelium.core.setup.mongo;

import org.junit.jupiter.api.Test;

import static io.opencelium.core.testsupport.fixture.ComposePullEvents.downloadComplete;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.downloading;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.extracting;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.pullComplete;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.pulling;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.waiting;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * The progress of a pull from the JSON events of Docker Compose: the bytes of each layer add up to the downloaded
 * bytes and the total. Docker gives the size of a layer only while it downloads, so a layer that never downloads in
 * steps adds nothing. An error event keeps the cause from Docker. A line that is no JSON event changes nothing.
 */
class PullProgressTest {

	private final PullProgress progress = new PullProgress();

	@Test
	void acceptAddsTheBytesOfEachLayerWhenLayersDownload() {
		progress.accept(pulling());
		progress.accept(waiting("a1"));
		progress.accept(waiting("b2"));
		progress.accept(downloading("a1", 1_000_000, 4_000_000));
		progress.accept(downloading("b2", 2_000_000, 12_000_000));
		progress.accept(downloading("a1", 3_000_000, 4_000_000));

		assertThat(progress.done()).isEqualTo(5_000_000);
		assertThat(progress.total()).isEqualTo(16_000_000);
	}

	@Test
	void acceptCountsALayerAsCompleteWhenItsDownloadIsComplete() {
		progress.accept(downloading("a1", 1_000_000, 4_000_000));
		progress.accept(downloading("b2", 2_000_000, 12_000_000));
		progress.accept(downloadComplete("a1"));
		// The unpack of a layer gives a current value without a size; it does not move the download back.
		progress.accept(extracting("a1"));
		progress.accept(pullComplete("a1"));
		// A small layer completes without a size, so it adds nothing.
		progress.accept(downloadComplete("c3"));

		assertThat(progress.done()).isEqualTo(6_000_000);
		assertThat(progress.total()).isEqualTo(16_000_000);
	}

	@Test
	void acceptKeepsTheDockerMessageWhenAnErrorEventArrives() {
		progress.accept(pulling());
		// The event as Docker Compose prints it when the credential helper is not on the PATH.
		progress.accept("""
				{"error":true,"message":"error getting credentials - err: exec: \\"docker-credential-desktop\\": \
				executable file not found in $PATH, out: ``"}""");

		assertThat(progress.error()).contains("error getting credentials - err: exec: \"docker-credential-desktop\":"
				+ " executable file not found in $PATH, out: ``");
	}

	@Test
	void acceptReplacesControlCharactersWhenTheErrorMessageHasThem() {
		// A registry can send escape sequences that would move the cursor or clear the line of the terminal.
		progress.accept("""
				{"error":true,"message":"denied\\u001b[2K\\r  OK MongoDB answers\\n"}""");

		assertThat(progress.error()).contains("denied [2K   OK MongoDB answers ");
	}

	@Test
	void acceptIgnoresALineWhenItIsNoJson() {
		progress.accept(downloading("a1", 1_000_000, 4_000_000));
		progress.accept("WARN[0000] docker-compose.yml: the attribute `version` is obsolete");
		progress.accept("unknown flag: --progress");
		progress.accept("{\"id\":\"a1\",\"text\":\"Downloading\",\"current\":");
		progress.accept("[1, 2]");
		progress.accept("");

		assertThat(progress.done()).isEqualTo(1_000_000);
		assertThat(progress.total()).isEqualTo(4_000_000);
		assertThat(progress.error()).isEmpty();
	}

}
