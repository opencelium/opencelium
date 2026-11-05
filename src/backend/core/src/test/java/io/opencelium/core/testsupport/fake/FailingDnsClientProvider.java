package io.opencelium.core.testsupport.fake;

import com.mongodb.internal.dns.JndiDnsClient;
import com.mongodb.spi.dns.DnsClient;
import com.mongodb.spi.dns.DnsClientProvider;
import com.mongodb.spi.dns.DnsException;

/**
 * The DNS client of the MongoDB driver in the tests: a lookup for {@link #FAILING_HOST} fails as a DNS server failure
 * would, and every other lookup goes to the driver's own JNDI client, so a real {@code mongodb+srv} server still works.
 * The driver finds the provider through {@code META-INF/services} in the test resources. A {@code mongodb+srv} URI with
 * this host shows what a host without a working DNS gets, which a test cannot cause otherwise.
 */
public final class FailingDnsClientProvider implements DnsClientProvider {

	/** A reserved name that no DNS server knows. */
	public static final String FAILING_HOST = "dns-fails.opencelium.invalid";

	@Override
	public DnsClient create() {
		DnsClient real = new JndiDnsClient();
		return (name, type) -> {
			if (name.endsWith(FAILING_HOST)) {
				throw new DnsException("the test DNS server fails for " + name, null);
			}
			return real.getResourceRecordData(name, type);
		};
	}

}
