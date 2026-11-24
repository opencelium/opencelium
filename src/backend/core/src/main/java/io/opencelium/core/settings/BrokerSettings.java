package io.opencelium.core.settings;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The settings of the connection of core to an AMQP broker. They have no effect on the transport yet: the feature
 * that sends executions to a broker reads them, and then owns these definitions.
 */
@Configuration(proxyBeanMethods = false)
class BrokerSettings {

	static final SettingDefinition HOST = new SettingDefinition("broker.host", SettingType.HOST, null, 1, 253);

	static final SettingDefinition PORT = new SettingDefinition("broker.port", SettingType.INTEGER, 5672, 1, 65535);

	static final SettingDefinition VIRTUAL_HOST = new SettingDefinition("broker.virtual-host", SettingType.TEXT, "/", 1,
			255);

	static final SettingDefinition USERNAME = new SettingDefinition("broker.username", SettingType.TEXT, null, 1, 255);

	static final SettingDefinition PASSWORD = new SettingDefinition("broker.password", SettingType.SECRET, null, 1,
			255);

	@Bean
	SettingDefinition brokerHostSetting() {
		return HOST;
	}

	@Bean
	SettingDefinition brokerPortSetting() {
		return PORT;
	}

	@Bean
	SettingDefinition brokerVirtualHostSetting() {
		return VIRTUAL_HOST;
	}

	@Bean
	SettingDefinition brokerUsernameSetting() {
		return USERNAME;
	}

	@Bean
	SettingDefinition brokerPasswordSetting() {
		return PASSWORD;
	}

}
