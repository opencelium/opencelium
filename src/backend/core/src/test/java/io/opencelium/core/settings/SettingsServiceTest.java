package io.opencelium.core.settings;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.settings.InvalidSettingsException.Problem;
import io.opencelium.core.settings.InvalidSettingsException.SettingError;
import io.opencelium.core.settings.SettingsService.SettingValue;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * A change of the settings applies all its values or none, and the database keeps only the values that are different
 * from the default.
 */
@MongoIntegrationTest
class SettingsServiceTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, SettingsServiceTest.class, () -> dataDir);
	}

	@Autowired
	SettingsService settings;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeTheSettingsOfAnotherTest() {
		mongo.getCollection("settings").deleteMany(new Document());
	}

	@Test
	void changeSetsEachNewValueWhenEachValueIsValid() {
		List<SettingValue> after = settings.change(Map.of("broker.host", "rabbit.internal", "broker.port", 5673));

		assertThat(after).contains(new SettingValue("broker.host", "rabbit.internal", false),
				new SettingValue("broker.port", 5673, false), new SettingValue("broker.virtual-host", "/", true));
		assertThat(settings.read()).isEqualTo(after);
		assertThat(broker()).isEqualTo(new Document("host", "rabbit.internal").append("port", 5673));
	}

	@Test
	void changeRemovesTheFieldWhenTheNewValueIsTheDefault() {
		settings.change(Map.of("broker.host", "rabbit.internal", "broker.port", 5673));

		List<SettingValue> after = settings.change(Map.of("broker.port", 5672));

		assertThat(after).contains(new SettingValue("broker.port", 5672, true));
		assertThat(broker()).isEqualTo(new Document("host", "rabbit.internal"));
	}

	@Test
	void changeChangesNothingWhenOneValueIsNotValid() {
		settings.change(Map.of("broker.host", "rabbit.internal"));
		Map<String, Object> change = new LinkedHashMap<>();
		change.put("broker.host", "other.internal");
		change.put("broker.port", 0);
		change.put("broker.vhost", "x");

		InvalidSettingsException refused = catchThrowableOfType(InvalidSettingsException.class,
				() -> settings.change(change));

		assertThat(refused.errors()).containsExactly(new SettingError("broker.port", Problem.INVALID_VALUE),
				new SettingError("broker.vhost", Problem.UNKNOWN_KEY));
		assertThat(refused).hasMessageNotContaining("other.internal");
		assertThat(broker()).isEqualTo(new Document("host", "rabbit.internal"));
	}

	/** The subdocument of the broker settings in the database, or {@code null} when there is none. */
	private Document broker() {
		Document installation = mongo.getCollection("settings").find(new Document("_id", "installation")).first();
		return installation == null ? null : installation.get("broker", Document.class);
	}

}
