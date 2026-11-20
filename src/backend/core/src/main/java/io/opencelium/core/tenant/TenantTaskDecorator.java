package io.opencelium.core.tenant;

import org.springframework.core.task.TaskDecorator;

final class TenantTaskDecorator implements TaskDecorator {

	TenantTaskDecorator(TenantRunner tenantRunner) {
	}

	@Override
	public Runnable decorate(Runnable task) {
		throw new UnsupportedOperationException("not implemented");
	}

}
