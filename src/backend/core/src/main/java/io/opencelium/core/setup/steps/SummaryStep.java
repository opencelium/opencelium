package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

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
		var values = new BootstrapValues(context.deploymentMode(), context.dataDir()
				.orElseThrow(() -> new IllegalStateException("The data directory step did not run.")), context.port()
				.orElseThrow(() -> new IllegalStateException("The port step did not run.")), context.mongoUri()
				.orElseThrow(() -> new IllegalStateException("The MongoDB step did not run.")), context.masterKeyFile());
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", values.deploymentMode().propertyValue());
		rows.put("Data directory", values.dataDir().toString());
		rows.put("Web port", String.valueOf(values.port()));
		rows.put("MongoDB", MongoConnection.redact(values.mongoUri()));
		context.masterKeySource().ifPresent(source -> rows.put("Master key", source));
		prompter.box("Your answers", rows);
		prompter.print("");
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
		// The env file holds the whole URI, and the start in this process gets it as an argument.
		context.putEnvironment(YmlRenderer.MONGO_URI_VARIABLE, values.mongoUri());
		context.filePlan().add(PlannedFile.groupReadable(locations.ymlFile(), YmlRenderer.render(values)));
		context.filePlan().add(PlannedFile.ownerOnly(locations.envFile(), EnvRenderer.render(context.environment())));
	}

	private static String marker(Path file) {
		return Files.exists(file) ? "   (replaces the file that exists)" : "";
	}

}
