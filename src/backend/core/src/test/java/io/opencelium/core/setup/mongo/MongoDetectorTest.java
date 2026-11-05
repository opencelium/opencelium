package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The detector looks for a server on the local MongoDB port before the MongoDB step shows its menu. A port that
 * accepts a connection counts as a local server; the detector only connects and closes, it sends nothing.
 */
class MongoDetectorTest {

	@Test
	void detectFindsLocalServerWhenPortListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			MongoDetection detection = new MongoDetector("localhost", server.getLocalPort()).detect();

			assertThat(detection.localServer()).isTrue();
		}
	}

	@Test
	void detectFindsNothingWhenPortIsClosed() throws IOException {
		int closedPort;
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			closedPort = server.getLocalPort();
		}

		MongoDetection detection = new MongoDetector("localhost", closedPort).detect();

		assertThat(detection.localServer()).isFalse();
	}

	@Test
	void localUriNamesTheProbedAddressAndTheDefaultDatabase() {
		assertThat(new MongoDetector().localUri()).isEqualTo("mongodb://localhost:27017/opencelium");
		assertThat(new MongoDetector("localhost", 27018).localUri()).isEqualTo("mongodb://localhost:27018/opencelium");
	}

}
