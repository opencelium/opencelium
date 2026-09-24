package io.opencelium.core.config;

import java.util.Optional;

import org.springframework.boot.context.properties.bind.Binder;

/** Reads raw bootstrap values through the {@link Binder}, so relaxed names ({@code OPENCELIUM_DEPLOYMENTMODE}) count. */
final class BootstrapProperties {

	private BootstrapProperties() {
	}

	static Optional<String> read(Binder binder, String name) {
		return binder.bind(name, String.class).map(Optional::of).orElseGet(Optional::empty);
	}

}
