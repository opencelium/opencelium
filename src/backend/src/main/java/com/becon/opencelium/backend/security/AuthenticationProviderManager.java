package com.becon.opencelium.backend.security;

import org.springframework.ldap.CommunicationException;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.ProviderNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;

import java.net.ConnectException;
import java.util.List;

public class AuthenticationProviderManager extends ProviderManager {

    public AuthenticationProviderManager(List<AuthenticationProvider> providers) {
        super(providers);
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        Class<? extends Authentication> toTest = authentication.getClass();
        AuthenticationException lastException = null;
        Authentication result = null;

        for (AuthenticationProvider provider : getProviders()) {
            if (!provider.supports(toTest)) {
                continue;
            }

            try {
                result = provider.authenticate(authentication);

                if (result != null) {
                    if ((result instanceof AbstractAuthenticationToken) && (result.getDetails() == null)) {
                        AbstractAuthenticationToken token = (AbstractAuthenticationToken) result;
                        token.setDetails(authentication.getDetails());
                    }

                    break;
                }
            } catch (AccountStatusException | InternalAuthenticationServiceException e) {
                if (provider instanceof LdapAuthenticationProvider) {
                    if (e.getCause() instanceof ConnectException || e.getCause() instanceof CommunicationException) {
                        continue;
                    }
                }

                throw e;
            } catch (AuthenticationException e) {
                lastException = e;
            }
        }

        if (result != null) {
            if (super.isEraseCredentialsAfterAuthentication() && (result instanceof CredentialsContainer)) {
                ((CredentialsContainer) result).eraseCredentials();
            }

            return result;
        }

        if (lastException == null) {
            lastException = new ProviderNotFoundException(this.messages.getMessage("ProviderManager.providerNotFound",
                    new Object[] { toTest.getName() }, "No AuthenticationProvider found for {0}"));
        }

        throw lastException;
    }
}
