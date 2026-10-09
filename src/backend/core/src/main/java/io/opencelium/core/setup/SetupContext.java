package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.Optional;
import java.util.OptionalInt;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.setup.files.FilePlan;

/**
 * What the wizard knows so far: the answers of the steps that ran, and the files the summary planned from them.
 * Each step reads what earlier steps stored and stores its own answer. Nothing here touches the disk; the wizard
 * writes the plan after the last step.
 */
public final class SetupContext {

	/**
	 * The wizard installs the self-host mode only. The cloud mode needs a hand-written configuration and is set up
	 * by the consulting service, not by this wizard.
	 */
	public static final DeploymentMode DEPLOYMENT_MODE = DeploymentMode.SELF_HOST;

	private final FilePlan filePlan = new FilePlan();

	private Path dataDir;

	private Integer port;

	public DeploymentMode deploymentMode() {
		return DEPLOYMENT_MODE;
	}

	/** The answer of the data directory step, absolute; empty before it ran. */
	public Optional<Path> dataDir() {
		return Optional.ofNullable(dataDir);
	}

	public void setDataDir(Path dataDir) {
		this.dataDir = dataDir;
	}

	/** The answer of the port step; empty before it ran. */
	public OptionalInt port() {
		return port == null ? OptionalInt.empty() : OptionalInt.of(port);
	}

	public void setPort(int port) {
		this.port = port;
	}

	/** The files to write after the steps; empty until the summary was confirmed. */
	public FilePlan filePlan() {
		return filePlan;
	}

}
