package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.Set;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.ConfigLocations;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.files.BootstrapValues;
import io.opencelium.core.setup.files.EnvRenderer;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.files.YmlRenderer;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * The last screen: the answers in a box, the MongoDB URI without its password, the list of the files that will be
 * written, what comes after the write, and the confirmation. After the write come the actions that earlier steps
 * planned, then the start of the application. The confirmation names only the write, because an action can ask a
 * question of its own, for example the backup question of a new master key, and that question comes before the
 * start. Yes plans application.yml and the env file with the entries that the steps added; the wizard writes the
 * files, runs the actions and starts the application after this step. No cancels the setup, and the wizard drops
 * the plan. A file that exists is marked, because the write replaces it. In batch mode the confirmation is not
 * asked: the setup file is the decision.
 * <p>
 * A value that an environment variable gives shows the name of the variable, and the summary tells to keep each such
 * variable for each later start. Neither file holds such a value, so the environment stays its only source: a
 * MongoDB connection of {@code SPRING_MONGODB_} variables gets no line in application.yml, and one of
 * {@code OC_MONGO_URI} keeps only the placeholder, without an entry in the env file. The env file is written also
 * without an entry, because the service needs the file that it names, and the new file replaces an old entry.
 */
public final class SummaryStep implements SetupStep {

	static final String CONFIRM_QUESTION = "Write the files?";

	private static final String CONFIRM_HELP = "y writes the files, then does what is listed under 'After the write',"
			+ " in that order.\nn ends the setup; nothing is written.";

	/** The last item after the write: the wizard starts the application when the actions are done. */
	private static final String START = "Start OpenCelium";

	private final ConfigLocations locations;

	public SummaryStep(ConfigLocations locations) {
		this.locations = locations;
	}

	@Override
	public String name() {
		return "Summary";
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		SequencedMap<String, String> fromEnvironment = context.fromEnvironment();
		Path dataDir = context.dataDir()
				.orElseThrow(() -> new IllegalStateException("The data directory step did not run."));
		int port = context.port().orElseThrow(() -> new IllegalStateException("The port step did not run."));
		MongoConnection connection = context.mongoConnection();
		Optional<String> mongoUri = context.mongoUri();
		List<String> mongoVariables = context.mongoVariables();
		var values = new BootstrapValues(context.deploymentMode(), dataDir, port, mongoUri, context.masterKeyFile(),
				leftOut(fromEnvironment, mongoVariables));
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", values.deploymentMode().propertyValue()
				+ source(fromEnvironment, OpenCeliumProperties.DEPLOYMENT_MODE));
		rows.put("Data directory", values.dataDir() + source(fromEnvironment, OpenCeliumProperties.DATA_DIR));
		rows.put("Web port", values.port() + source(fromEnvironment, BootstrapProperties.SERVER_PORT));
		rows.put("MongoDB", mongoUri.map(MongoConnection::redact).orElseGet(connection::redacted)
				+ (mongoVariables.isEmpty() ? "" : "   (from " + String.join(", ", mongoVariables) + ")"));
		context.masterKeySource().ifPresent(source -> rows.put("Master key", source));
		prompter.box("Your answers", rows);
		prompter.print("");
		List<String> keep = new ArrayList<>(fromEnvironment.values());
		keep.addAll(mongoVariables);
		context.masterKeyVariable().ifPresent(keep::add);
		if (!keep.isEmpty()) {
			prompter.info("Keep these variables for each later start: " + String.join(", ", keep) + ".",
					laterStart(keep).toArray(String[]::new));
			prompter.print("");
		}
		List<Path> files = new ArrayList<>(List.of(locations.ymlFile(), locations.envFile()));
		context.filePlan().files().forEach(file -> files.add(file.path()));
		prompter.list("Files to write", files.stream().map(file -> file + marker(file)).toList());
		List<String> afterTheWrite = new ArrayList<>();
		context.filePlan().actions().forEach(action -> afterTheWrite.add(action.description()));
		afterTheWrite.add(START);
		prompter.print("");
		prompter.list("After the write", afterTheWrite);
		prompter.print("");
		if (!context.values().yesNo(CONFIRM_QUESTION, CONFIRM_HELP, true, prompter)) {
			throw new SetupCancelledException();
		}
		// The env file holds the whole URI that the user chose, and the start in this process gets it as an argument.
		// A connection of the environment reaches each start through the environment only.
		mongoUri.ifPresent(uri -> context.putEnvironment(YmlRenderer.MONGO_URI_VARIABLE, uri));
		context.filePlan().add(PlannedFile.groupReadable(locations.ymlFile(), YmlRenderer.render(values)));
		context.filePlan().add(PlannedFile.ownerOnly(locations.envFile(), EnvRenderer.render(context.environment())));
	}

	/**
	 * The bootstrap properties that application.yml leaves out. A connection of {@code SPRING_MONGODB_} variables
	 * leaves out the MongoDB line; one of {@code OC_MONGO_URI} keeps it, because the line refers to that variable.
	 */
	private static Set<String> leftOut(SequencedMap<String, String> fromEnvironment, List<String> mongoVariables) {
		Set<String> leftOut = new LinkedHashSet<>(fromEnvironment.sequencedKeySet());
		if (!mongoVariables.isEmpty() && !mongoVariables.equals(List.of(YmlRenderer.MONGO_URI_VARIABLE))) {
			leftOut.add(BootstrapProperties.MONGODB_URI);
		}
		return leftOut;
	}

	/**
	 * What a later start without a variable does. No file holds these values, so it falls back to the default; only
	 * {@code OC_MONGO_URI} has none, because application.yml refers to it, and a start without it stops.
	 */
	private static List<String> laterStart(List<String> keep) {
		List<String> lines = new ArrayList<>(List.of("Set them in the shell or in the environment of the service."
				+ " A later start"));
		if (!keep.contains(YmlRenderer.MONGO_URI_VARIABLE)) {
			lines.add("without a variable uses the default, not the value above.");
			return lines;
		}
		lines.add("without " + YmlRenderer.MONGO_URI_VARIABLE + " stops, because application.yml refers to it.");
		if (keep.size() > 1) {
			lines.add("A later start without another of them uses the default, not the value above.");
		}
		return lines;
	}

	/** After a value that a variable gives: the name of the variable; nothing for an answer of the setup. */
	private static String source(SequencedMap<String, String> fromEnvironment, String property) {
		String variable = fromEnvironment.get(property);
		return variable == null ? "" : "   (from " + variable + ")";
	}

	private static String marker(Path file) {
		return Files.exists(file) ? "   (replaces the file that exists)" : "";
	}

}
