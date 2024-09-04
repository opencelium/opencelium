package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.security.DaoUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.authentication.LdapAuthenticator;
import org.springframework.security.ldap.search.FilterBasedLdapUserSearch;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;
import org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator;


@Configuration
public class AuthenticationProviderConfiguration {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private DaoUserDetailsService daoUserDetailsService;


    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        final DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setPasswordEncoder(bCryptPasswordEncoder);
        authenticationProvider.setUserDetailsService(daoUserDetailsService);

        return authenticationProvider;
    }

    @Bean
    public LdapAuthenticationProvider ldapAuthenticationProvider() {
        return new LdapAuthenticationProvider(ldapAuthenticator(), ldapAuthoritiesPopulator());
    }

    @Bean
    public LdapAuthenticator ldapAuthenticator() {
        BindAuthenticator authenticator = new BindAuthenticator(ldapContextSource());
        authenticator.setUserSearch(new FilterBasedLdapUserSearch("ou=users,ou=system", "(cn={0})", ldapContextSource()));

        return authenticator;
    }

    @Bean
    public LdapAuthoritiesPopulator ldapAuthoritiesPopulator() {
        return new DefaultLdapAuthoritiesPopulator(ldapContextSource(), "ou=groups,ou=system");
    }

    @Bean
    public LdapContextSource ldapContextSource() {
        LdapContextSource contextSource = new LdapContextSource();

        contextSource.setUrl("ldap://localhost:10389");
        contextSource.setUserDn("uid=admin,ou=system");
        contextSource.setPassword("secret");

        return contextSource;
    }
}
