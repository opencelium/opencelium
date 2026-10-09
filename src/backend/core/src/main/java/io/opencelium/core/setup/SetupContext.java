package io.opencelium.core.setup;

import java.util.Optional;

import io.opencelium.core.config.DeploymentMode;

/**
 * What the wizard knows so far: the answers of the steps that ran. Each step reads what earlier steps stored and
 * stores its own answer. Nothing here touches the disk; the files are written after the summary, from this state.
 */
public final class SetupContext {

	private DeploymentMode deploymentMode;

	/** The answer of the mode step; empty before it ran. */
	public Optional<DeploymentMode> deploymentMode() {
		return Optional.ofNullable(deploymentMode);
	}

	public void setDeploymentMode(DeploymentMode mode) {
		this.deploymentMode = mode;
	}

}
