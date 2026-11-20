package io.opencelium.core.secrets.keys;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class SigningKeyTest {

	@Test
	void toStringShowsTheVersionOnly() {
		assertThat(new SigningKey(1, new byte[32])).hasToString("SigningKey[version=1]");
	}

	@Test
	void closeZeroesTheKeyAndMakesItUnusable() {
		byte[] material = new byte[32];
		material[0] = 7;
		var key = new SigningKey(1, material);

		key.close();

		assertThat(material).containsOnly(0);
		assertThatIllegalStateException().isThrownBy(key::secretKey).withMessageContaining("closed");
	}

}
