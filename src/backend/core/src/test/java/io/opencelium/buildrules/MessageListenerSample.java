package io.opencelium.buildrules;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.messaging.DefaultMessageListenerContainer;

/**
 * Breaks the rule for the tenant documents: a message listener of Spring Data with the template, which reads the
 * changes of the collections of its requests.
 */
class MessageListenerSample {

	void listen(MongoTemplate mongo) {
		new DefaultMessageListenerContainer(mongo).start();
	}

}
