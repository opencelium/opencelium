package io.opencelium.core.user;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GeneratedPasswordsTest {

	private final List<String> samples = IntStream.range(0, 1000)
			.mapToObj(i -> new String(new GeneratedPasswords().next())).toList();

	@Test
	void nextReturns20Characters() {
		assertThat(samples).allSatisfy(password -> assertThat(password).hasSize(20));
	}

	@Test
	void nextUsesOnlyLettersDigitsAndDash() {
		assertThat(samples).allSatisfy(password -> assertThat(password).matches("[A-Za-z0-9-]{20}"));
	}

	@Test
	void nextContainsAnUpperCaseLetterALowerCaseLetterAndADigit() {
		assertThat(samples).allSatisfy(password -> assertThat(password).containsPattern("[A-Z]")
				.containsPattern("[a-z]").containsPattern("[0-9]"));
	}

	@Test
	void nextReturnsADifferentPasswordEveryTime() {
		Set<String> distinct = new HashSet<>(samples);

		assertThat(distinct).hasSize(1000);
	}

}
