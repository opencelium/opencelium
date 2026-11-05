package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.host.CommandRunner;
import io.opencelium.core.testsupport.fake.RecordingCommandRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The detector looks for a server on the local MongoDB port and for Docker Compose before the MongoDB step shows its
 * menu. A port that accepts a connection counts as a local server; the detector only connects and closes, it sends
 * nothing. Docker Compose counts as present when {@code docker compose version} ends with exit code 0.
 */
class MongoDetectorTest {

	private final RecordingCommandRunner commands = new RecordingCommandRunner();

	@Test
	void detectFindsLocalServerWhenPortListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			MongoDetection detection = new MongoDetector("localhost", server.getLocalPort(), commands).detect();

			assertThat(detection.localServer()).isTrue();
		}
	}

	@Test
	void detectFindsNothingWhenPortIsClosed() throws IOException {
		int closedPort;
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			closedPort = server.getLocalPort();
		}

		MongoDetection detection = new MongoDetector("localhost", closedPort, commands).detect();

		assertThat(detection.localServer()).isFalse();
	}

	@Test
	void detectFindsDockerComposeWhenVersionCommandSucceeds() {
		commands.answer("docker compose version", 0, "Docker Compose version v2.29.1\n");

		MongoDetection detection = new MongoDetector("localhost", 1, commands).detect();

		assertThat(detection.dockerCompose()).isTrue();
		assertThat(commands.commands()).containsExactly("docker compose version");
	}

	@Test
	void detectFindsNoDockerComposeWhenVersionCommandFails() {
		commands.answer("docker compose version", 1, "docker: 'compose' is not a docker command.\n");

		assertThat(new MongoDetector("localhost", 1, commands).detect().dockerCompose()).isFalse();
	}

	@Test
	void detectFindsNoDockerComposeWhenDockerIsNotInstalled() {
		commands.answer("docker compose version", CommandRunner.Result.CANNOT_START, "cannot run docker");

		assertThat(new MongoDetector("localhost", 1, commands).detect().dockerCompose()).isFalse();
	}

	@Test
	void localUriNamesTheProbedAddressAndTheDefaultDatabase() {
		assertThat(new MongoDetector().localUri()).isEqualTo("mongodb://localhost:27017/opencelium");
		assertThat(new MongoDetector("localhost", 27018, commands).localUri())
				.isEqualTo("mongodb://localhost:27018/opencelium");
	}

}
