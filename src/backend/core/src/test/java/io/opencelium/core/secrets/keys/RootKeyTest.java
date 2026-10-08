package io.opencelium.core.secrets.keys;

import org.junit.jupiter.api.Test;

import static io.opencelium.core.secrets.keys.RootKey.INITIAL_ID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class RootKeyTest {

	@Test
	void toStringShowsTheKeyIdOnly() {
		assertThat(new RootKey(INITIAL_ID, RootKeySource.ENV, new byte[32])).hasToString("RootKey[k-01]");
	}

	@Test
	void constructorRejectsKeysThatAreNot32Bytes() {
		assertThatIllegalArgumentException().isThrownBy(() -> new RootKey(INITIAL_ID, RootKeySource.ENV, new byte[16]))
				.withMessageContaining("32").withMessageContaining("16");
	}

	@Test
	void closeZeroesTheKeyAndMakesItUnusable() {
		byte[] material = new byte[32];
		material[0] = 7;
		var key = new RootKey(INITIAL_ID, RootKeySource.ENV, material);

		key.close();

		assertThat(material).containsOnly(0);
		assertThatIllegalStateException().isThrownBy(key::secretKey).withMessageContaining("closed");
	}

}
