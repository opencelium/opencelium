package io.opencelium.buildrules;

import org.springframework.beans.factory.annotation.Value;

/** Breaks the rule "no @Value": a configuration value from the yml file in a field. */
class ValueSample {

	@Value("${sample.value:1}")
	int value;

}
