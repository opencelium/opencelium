package io.opencelium.core.setup.steps;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;

/**
 * Where OpenCelium finds MongoDB. Not implemented yet.
 */
public final class MongoStep implements SetupStep {

	public MongoStep() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	MongoStep(MongoDetector detector, Function<MongoConnection, Optional<String>> ping) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public List<Question> questions() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
