package com.becon.opencelium.backend.security.oidc;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import java.util.Collections;
import java.util.Iterator;
import java.util.function.Supplier;

/**
 * Resolves the client registration on the first lookup and keeps it, so that nothing is fetched from
 * the identity provider while the application starts - a restart no longer fails when the provider is
 * down, and the schedules and webhooks keep running.
 *
 * A failed lookup is deliberately not remembered: the next login tries again, so the feature recovers
 * on its own once the provider is reachable.
 */
public class LazyClientRegistrationRepository implements ClientRegistrationRepository, Iterable<ClientRegistration> {

    private final String registrationId;
    private final Supplier<ClientRegistration> registrationFactory;

    private volatile ClientRegistration registration;

    public LazyClientRegistrationRepository(String registrationId, Supplier<ClientRegistration> registrationFactory) {
        this.registrationId = registrationId;
        this.registrationFactory = registrationFactory;
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        if (!this.registrationId.equals(registrationId)) {
            return null;
        }

        ClientRegistration resolved = registration;
        if (resolved == null) {
            // Discovery can be triggered by parallel login requests, so only one of them runs it.
            synchronized (this) {
                if (registration == null) {
                    registration = registrationFactory.get();
                }

                resolved = registration;
            }
        }

        return resolved;
    }

    @Override
    public Iterator<ClientRegistration> iterator() {
        return Collections.singletonList(findByRegistrationId(registrationId)).iterator();
    }
}
