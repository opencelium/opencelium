package io.opencelium.core.user;

import org.junit.jupiter.api.Test;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class CreateAdminCommandTest {

	@Test
	void toStringMasksThePassword() {
		var command = new CreateAdminCommand(TenantId.SELF_HOST, "admin", "s3cret-Pass".toCharArray(), false, false);

		assertThat(command.toString()).contains("username=admin").contains("password=****").doesNotContain("s3cret");
	}

	@Test
	void constructorRejectsABlankUsername() {
		assertThatIllegalArgumentException()
				.isThrownBy(() -> new CreateAdminCommand(TenantId.SELF_HOST, " ", "pw".toCharArray(), false, false))
				.withMessageContaining("username");
	}

	@Test
	void constructorRejectsAnEmptyPassword() {
		assertThatIllegalArgumentException()
				.isThrownBy(() -> new CreateAdminCommand(TenantId.SELF_HOST, "admin", new char[0], false, false))
				.withMessageContaining("password");
	}

}
