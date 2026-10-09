package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.StandardProtocolFamily;
import java.nio.channels.ServerSocketChannel;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The port question: the default in brackets, a number from 1 to 65535 that this process can bind right now. A
 * port in use, a number out of range, or text is explained and asked again. The tests use ports that are free at
 * that moment, never 9090, which a running application may hold.
 */
class PortStepTest {

	private static final String RANGE_MESSAGE = "Please enter a port number between 1 and 65535.";

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final SetupContext context = new SetupContext();

	@Test
	void runStoresDefaultWhenInputIsEmpty() throws IOException {
		int free = freePort();
		console.type("");

		new PortStep(free).run(context, prompter());

		assertThat(context.port()).hasValue(free);
		assertThat(console.output()).contains("  Web port        [" + free + "]: ");
	}

	@Test
	void runStoresTypedPort() throws IOException {
		int free = freePort();
		console.type(String.valueOf(free));

		new PortStep(freePort()).run(context, prompter());

		assertThat(context.port()).hasValue(free);
	}

	@Test
	void runAsksAgainWhenPortIsInUse() throws IOException {
		int free = freePort();
		try (ServerSocket busy = new ServerSocket(0)) {
			console.type(String.valueOf(busy.getLocalPort()), String.valueOf(free));

			new PortStep(free).run(context, prompter());

			assertThat(context.port()).hasValue(free);
			assertThat(console.output()).contains("Port " + busy.getLocalPort() + " is in use.");
		}
	}

	@Test
	void runAsksAgainWhenPortIsHeldByAnIpv4OnlyListener() throws IOException {
		// A plain IPv4 server, as many tools open one; the dual-stack probe alone would miss it on macOS.
		int free = freePort();
		try (ServerSocketChannel busy = ServerSocketChannel.open(StandardProtocolFamily.INET)) {
			busy.bind(new InetSocketAddress(InetAddress.ofLiteral("0.0.0.0"), 0));
			int port = ((InetSocketAddress) busy.getLocalAddress()).getPort();
			console.type(String.valueOf(port), String.valueOf(free));

			new PortStep(free).run(context, prompter());

			assertThat(context.port()).hasValue(free);
			assertThat(console.output()).contains("Port " + port + " is in use.");
		}
	}

	@Test
	void runAsksAgainWhenPortIsOutOfRange() throws IOException {
		int free = freePort();
		console.type("0", "70000", String.valueOf(free));

		new PortStep(free).run(context, prompter());

		assertThat(context.port()).hasValue(free);
		assertThat(console.output().split(RANGE_MESSAGE, -1)).hasSize(3);
	}

	@Test
	void runAsksAgainWhenInputIsNotANumber() throws IOException {
		int free = freePort();
		console.type("abc", String.valueOf(free));

		new PortStep(free).run(context, prompter());

		assertThat(context.port()).hasValue(free);
		assertThat(console.output()).containsOnlyOnce(RANGE_MESSAGE);
	}

	@Test
	void defaultPortIsTheApplicationDefault() {
		assertThat(PortStep.DEFAULT_PORT).isEqualTo(9090);
	}

	private ConsolePrompter prompter() {
		return new ConsolePrompter(console);
	}

	private static int freePort() throws IOException {
		try (ServerSocket socket = new ServerSocket(0)) {
			return socket.getLocalPort();
		}
	}

}
