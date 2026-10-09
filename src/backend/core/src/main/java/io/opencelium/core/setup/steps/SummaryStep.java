package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;

import io.opencelium.core.setup.ConfigLocations;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.files.BootstrapValues;
import io.opencelium.core.setup.files.EnvRenderer;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.files.YmlRenderer;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.prompt.Screen;

/**
 * The last screen: the answers as a table, the two files that will be written, and the confirmation. Yes plans
 * application.yml and the env file, which the wizard writes after this step; no cancels the setup with nothing
 * planned. A file that exists is marked, because the write replaces it.
 */
public final class SummaryStep implements SetupStep {

	static final String CONFIRM_QUESTION = "Write the files and start OpenCelium?";

	private static final String CONFIRM_HELP = "y writes the two files and starts OpenCelium on them.\n"
			+ "n ends the setup; nothing is written.";

	private final ConfigLocations locations;

	public SummaryStep(ConfigLocations locations) {
		this.locations = locations;
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		var values = new BootstrapValues(context.deploymentMode(), context.dataDir()
				.orElseThrow(() -> new IllegalStateException("The data directory step did not run.")), context.port()
				.orElseThrow(() -> new IllegalStateException("The port step did not run.")));
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", values.deploymentMode().propertyValue());
		rows.put("Data directory", values.dataDir().toString());
		rows.put("Port", String.valueOf(values.port()));
		prompter.print("");
		prompter.print(Screen.section("Summary"));
		Screen.table(rows).forEach(prompter::print);
		prompter.print("");
		prompter.print("  Files to write");
		prompter.print("    " + locations.ymlFile() + marker(locations.ymlFile()));
		prompter.print("    " + locations.envFile() + marker(locations.envFile()));
		prompter.print("");
		if (!prompter.yesNo(CONFIRM_QUESTION, CONFIRM_HELP, true)) {
			throw new SetupCancelledException();
		}
		context.filePlan().add(PlannedFile.groupReadable(locations.ymlFile(), YmlRenderer.render(values)));
		context.filePlan().add(PlannedFile.ownerOnly(locations.envFile(), EnvRenderer.render(new LinkedHashMap<>())));
	}

	private static String marker(Path file) {
		return Files.exists(file) ? "  (replaces the file that exists)" : "";
	}

}
