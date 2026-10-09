package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.net.BindException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ProtocolFamily;
import java.net.StandardProtocolFamily;
import java.nio.channels.ServerSocketChannel;
import java.util.Optional;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * The HTTP port of the web interface and the API. A port is accepted when it is in range and this process can
 * bind it right now. The probe binds the IPv4 wildcard and the IPv6 wildcard once each and closes them again: a
 * listener of either family makes the port unusable, and on macOS an IPv6 bind alone would not notice an IPv4
 * listener. A port that another program holds, or that this user may not open, is reported before anything is
 * written.
 */
public final class PortStep implements SetupStep {

	/** The same default as {@code server.port} in the application's own configuration file. */
	static final int DEFAULT_PORT = 9090;

	private static final String RANGE_MESSAGE = "Please enter a port number between 1 and 65535.";

	private static final String HELP = """
			The HTTP port of the web interface and the API: http://<host>:<port>. The port must be free. A port
			below 1024 needs the root user on Linux.""";

	private final int defaultPort;

	public PortStep() {
		this(DEFAULT_PORT);
	}

	PortStep(int defaultPort) {
		this.defaultPort = defaultPort;
	}

	@Override
	public Optional<Question> question() {
		return Optional.of(new Question(ValueKey.PORT, "Web port", HELP, String.valueOf(defaultPort)));
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		String value = context.values().text(question().orElseThrow(), PortStep::check, prompter);
		context.setPort(Integer.parseInt(value));
	}

	/** The problem with {@code value} as the port, or empty when this process can bind it in both families. */
	static Optional<String> check(String value) {
		int port;
		try {
			port = Integer.parseInt(value);
		}
		catch (NumberFormatException ex) {
			return Optional.of(RANGE_MESSAGE);
		}
		if (port < 1 || port > 65535) {
			return Optional.of(RANGE_MESSAGE);
		}
		return probe(port, StandardProtocolFamily.INET, InetAddress.ofLiteral("0.0.0.0"))
				.or(() -> probe(port, StandardProtocolFamily.INET6, InetAddress.ofLiteral("::")));
	}

	private static Optional<String> probe(int port, ProtocolFamily family, InetAddress wildcard) {
		try (ServerSocketChannel channel = ServerSocketChannel.open(family)) {
			channel.bind(new InetSocketAddress(wildcard, port));
			return Optional.empty();
		}
		catch (UnsupportedOperationException ex) {
			// This family is not available on the host (for example IPv6 switched off): nothing to collide with.
			return Optional.empty();
		}
		catch (BindException ex) {
			// Linux refuses a port below 1024 to a normal user with "Permission denied"; everything else is in use.
			boolean permission = ex.getMessage() != null && ex.getMessage().contains("Permission denied");
			return Optional.of(permission ? "Port " + port + " cannot be opened by this user."
					: "Port " + port + " is in use.");
		}
		catch (IOException ex) {
			return Optional.of("Port " + port + " cannot be opened: " + ex.getMessage() + ".");
		}
	}

}
