package io.opencelium.core.secrets.keys;

import java.util.Arrays;
import java.util.Optional;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.core.convert.ConversionException;
import org.springframework.data.mapping.MappingException;
import org.springframework.data.mapping.model.MappingInstantiationException;

/**
 * Unwraps the oldest stored data key once, after all beans exist, so a wrong master key stops startup instead of
 * failing at the first secret a workflow needs. Runs after {@code MongoStartupPing}: the repository needs the pinged
 * client.
 */
final class KeyStartupCanary implements SmartInitializingSingleton {

	private static final Log log = LogFactory.getLog(KeyStartupCanary.class);

	private final WrappedDekRepository repository;

	private final DekWrapper wrapper;

	private final RootKey rootKey;

	KeyStartupCanary(WrappedDekRepository repository, DekWrapper wrapper, RootKey rootKey) {
		this.repository = repository;
		this.wrapper = wrapper;
		this.rootKey = rootKey;
	}

	@Override
	public void afterSingletonsInstantiated() {
		Optional<WrappedDek> canary;
		try {
			canary = repository.findFirstByOrderByCreatedAtAsc();
		}
		catch (MappingInstantiationException | MappingException | ConversionException ex) {
			// Not the exception's message: it can quote the document's values.
			throw KeyStartupException.damaged("The oldest stored data key in collection 'keys' is damaged: it lacks"
					+ " fields or has fields of the wrong type.");
		}
		if (canary.isEmpty()) {
			log.info("No stored data keys yet; canary unwrap skipped (key id " + rootKey.id() + ")");
			return;
		}
		WrappedDek wrapped = canary.get();
		byte[] dek;
		try {
			dek = wrapper.unwrap(rootKey, wrapped);
		}
		catch (WrongKeyException ex) {
			throw KeyStartupException.restoreOrReset("The master key from " + rootKey.source().description()
					+ " (key id " + rootKey.id() + ") cannot decrypt the stored data key of tenant '"
					+ wrapped.tenantId() + "'.");
		}
		catch (IllegalArgumentException ex) {
			throw KeyStartupException.damaged(ex.getMessage());
		}
		Arrays.fill(dek, (byte) 0);
		log.info("Master key canary unwrap ok (key id " + rootKey.id() + ")");
	}

}
