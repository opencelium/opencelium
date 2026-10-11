package com.becon.opencelium.backend.security.oidc;

import com.becon.opencelium.backend.database.mysql.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Principal produced by {@link OidcAuthenticationProvider}. Carries the raw group names of the
 * identity provider as authorities, the way LdapUserDetails carries group DNs, so that
 * AuthenticationFilter can resolve the OpenCelium role for the user. It also carries the account the
 * identity has been matched to, because only the provider decides which account a login belongs to.
 */
public class OidcUserDetails implements UserDetails {

    private final OidcIdentity identity;

    /** Account the identity is linked to, null while the identity still has to be provisioned. */
    private final User user;

    public OidcUserDetails(OidcIdentity identity, User user) {
        this.identity = identity;
        this.user = user;
    }

    public OidcIdentity getIdentity() {
        return identity;
    }

    public User getUser() {
        return user;
    }

    public String getEmail() {
        return identity.email();
    }

    public String getSubject() {
        return identity.subject();
    }

    public List<String> getGroups() {
        return identity.groups();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return identity.groups().stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return identity.email();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
