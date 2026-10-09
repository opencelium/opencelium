package io.opencelium.core.setup.steps;

import java.util.LinkedHashMap;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.prompt.Screen;

/**
 * The last screen: the answers as a table, so the user sees what the files will say. The write itself and the
 * confirmation that triggers it come with the file plan.
 */
public final class SummaryStep implements SetupStep {

	@Override
	public void run(SetupContext context, Prompter prompter) {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", context.deploymentMode().propertyValue());
		rows.put("Data directory", context.dataDir()
				.orElseThrow(() -> new IllegalStateException("The data directory step did not run.")).toString());
		rows.put("Port", String.valueOf(context.port()
				.orElseThrow(() -> new IllegalStateException("The port step did not run."))));
		prompter.print("");
		prompter.print(Screen.section("Summary"));
		Screen.table(rows).forEach(prompter::print);
		prompter.print("");
		// Until the file plan exists: say where the run ends, so the hand test has a visible result.
		prompter.print("  The file write comes in the next change.");
	}

}
