package io.opencelium.core.settings;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The type of a setting accepts a value only in its JSON form and inside the bounds of the setting definition. The
 * bounds of the cases are those of the broker settings: a port from 1 to 65535, a host name of up to 253 characters,
 * and a text of up to 255 characters.
 */
class SettingTypeTest {

	@Test
	void validateAcceptsAPortWhenItIsFrom1To65535() {
		assertThat(SettingType.INTEGER.validate(1, 1, 65535)).isTrue();
		assertThat(SettingType.INTEGER.validate(5672, 1, 65535)).isTrue();
		assertThat(SettingType.INTEGER.validate(65535, 1, 65535)).isTrue();
	}

	@Test
	void validateRefusesAPortWhenItIs0() {
		assertThat(SettingType.INTEGER.validate(0, 1, 65535)).isFalse();
	}

	@Test
	void validateRefusesAPortWhenItIs65536() {
		assertThat(SettingType.INTEGER.validate(65536, 1, 65535)).isFalse();
		assertThat(SettingType.INTEGER.validate(4_294_967_296L, 1, 65535)).isFalse();
	}

	@Test
	void validateRefusesAPortWhenItIsAString() {
		assertThat(SettingType.INTEGER.validate("5672", 1, 65535)).isFalse();
	}

	@Test
	void validateRefusesAPortWhenItHasAFraction() {
		assertThat(SettingType.INTEGER.validate(5672.5, 1, 65535)).isFalse();
		assertThat(SettingType.INTEGER.validate(5672.0, 1, 65535)).isFalse();
	}

	@Test
	void validateAcceptsAHostNameWhenEachLabelHas63CharactersOrLess() {
		String label63 = "a".repeat(63);

		assertThat(SettingType.HOST.validate("rabbit.internal", 1, 253)).isTrue();
		assertThat(SettingType.HOST.validate("rabbit-1.example.com", 1, 253)).isTrue();
		assertThat(SettingType.HOST.validate(label63 + ".example.com", 1, 253)).isTrue();
	}

	@Test
	void validateRefusesAHostNameWhenALabelHas64Characters() {
		assertThat(SettingType.HOST.validate("a".repeat(64) + ".example.com", 1, 253)).isFalse();
	}

	@Test
	void validateRefusesAHostNameWhenALabelHasAWrongCharacterOrIsEmpty() {
		assertThat(SettingType.HOST.validate("-rabbit.internal", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("rabbit..internal", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("rabbit internal", 1, 253)).isFalse();
	}

	@Test
	void validateRefusesAHostWhenItIsEmptyOrNotAString() {
		assertThat(SettingType.HOST.validate("", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate(5672, 1, 253)).isFalse();
	}

	@Test
	void validateAcceptsAnIpv4Address() {
		assertThat(SettingType.HOST.validate("10.0.0.15", 1, 253)).isTrue();
	}

	@Test
	void validateRefusesAHostWhenItsLastLabelIsDigitsButItIsNotAnIpv4Address() {
		assertThat(SettingType.HOST.validate("300.1.1.1", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("1.2.3", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("10.0.0.015", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("rabbit.10", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("10.rabbit", 1, 253)).isTrue();
	}

	@Test
	void validateAcceptsAnIpv6Address() {
		assertThat(SettingType.HOST.validate("::1", 1, 253)).isTrue();
		assertThat(SettingType.HOST.validate("2001:db8::8a2e:370:7334", 1, 253)).isTrue();
	}

	@Test
	void validateRefusesAnIpv6AddressWhenItHasAWrongForm() {
		assertThat(SettingType.HOST.validate("2001:db8:::1", 1, 253)).isFalse();
	}

	@Test
	void validateRefusesAnIpv6AddressWhenItHasBracketsOrAZone() {
		assertThat(SettingType.HOST.validate("[::1]", 1, 253)).isFalse();
		assertThat(SettingType.HOST.validate("fe80::1%en0", 1, 253)).isFalse();
	}

	@Test
	void validateRefusesATextWhenItHasMoreThan255Characters() {
		assertThat(SettingType.TEXT.validate("v".repeat(255), 1, 255)).isTrue();
		assertThat(SettingType.TEXT.validate("v".repeat(256), 1, 255)).isFalse();
	}

	@Test
	void validateRefusesATextWhenItHasAControlCharacter() {
		for (String control : new String[] { "\u0000", "\n", "\r", "\t", "\u001B", "\u007F", "\u0085", "\u202E",
				"\u2066" }) {
			assertThat(SettingType.TEXT.validate("oc" + control + "admin", 1, 255))
					.as("a text with the character U+%04X", (int) control.charAt(0)).isFalse();
		}
	}

	@Test
	void validateAcceptsATextWhenItHasLettersOfAnyScript() {
		assertThat(SettingType.TEXT.validate("Ünïcødé-用户 /vhost_1", 1, 255)).isTrue();
	}

	@Test
	void validateRefusesASecretWhenItHasAControlCharacter() {
		assertThat(SettingType.SECRET.validate("pa\u0000ss", 1, 255)).isFalse();
		assertThat(SettingType.SECRET.validate("pa\nss", 1, 255)).isFalse();
		assertThat(SettingType.SECRET.validate("pa\u202Ess", 1, 255)).isFalse();
	}

	@Test
	void validateRefusesASecretWhenItIsTheMask() {
		assertThat(SettingType.SECRET.validate("****", 1, 255)).isFalse();
		assertThat(SettingType.TEXT.validate("****", 1, 255)).as("a text setting has no mask").isTrue();
	}

	@Test
	void validateAcceptsASecretWhenItHasPrintableCharacters() {
		assertThat(SettingType.SECRET.validate("s3cret-Pässword! with spaces", 1, 255)).isTrue();
	}

	@Test
	void validateRefusesASecretWhenItIsEmptyOrLongerThan255Characters() {
		assertThat(SettingType.SECRET.validate("", 1, 255)).isFalse();
		assertThat(SettingType.SECRET.validate("p".repeat(256), 1, 255)).isFalse();
	}

	@Test
	void validateRefusesATextWhenItIsEmptyOrNotAString() {
		assertThat(SettingType.TEXT.validate("", 1, 255)).isFalse();
		assertThat(SettingType.TEXT.validate(15, 1, 255)).isFalse();
	}

}
