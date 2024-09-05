package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.security.DaoUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.ldap.SpringSecurityLdapTemplate;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.authentication.LdapAuthenticator;
import org.springframework.security.ldap.search.FilterBasedLdapUserSearch;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;
import org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Configuration
public class AuthenticationProviderConfiguration {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private DaoUserDetailsService daoUserDetailsService;

    @Autowired
    private LdapGroupMappingProperties groupMappingProperties;

    @Autowired
    private LdapProperties properties;


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
        String userSearchBase = properties.getUserSearchBase() + "," + properties.getBase();
        String searchFilter = properties.getUserSearchFilter();

        BindAuthenticator authenticator = new BindAuthenticator(ldapContextSource());
        authenticator.setUserSearch(new FilterBasedLdapUserSearch(userSearchBase, searchFilter, ldapContextSource()));

        return authenticator;
    }

    @Bean
    public LdapAuthoritiesPopulator ldapAuthoritiesPopulator() {
        String groupSearchBase = properties.getGroupSearchBase() + "," + properties.getBase();
        String searchFilter = properties.getGroupSearchFilter();

        DefaultLdapAuthoritiesPopulator authoritiesPopulator = new DefaultLdapAuthoritiesPopulator(ldapContextSource(), groupSearchBase);
        authoritiesPopulator.setGroupSearchFilter(searchFilter);
        authoritiesPopulator.setAuthorityMapper(this::authorityMapper);

        return authoritiesPopulator;
    }

    @Bean
    public LdapContextSource ldapContextSource() {
        LdapContextSource contextSource = new LdapContextSource();

        contextSource.setUrl(properties.getUrls());
        contextSource.setUserDn(properties.getManagerDn());
        contextSource.setPassword(properties.getManagerPassword());

        return contextSource;
    }


    private GrantedAuthority authorityMapper(Map<String, List<String>> userRole) {
        String group = groupMappingProperties.getDefaultMappingGroup();

        List<String> groups = userRole.get(SpringSecurityLdapTemplate.DN_KEY);
        if (groups != null && !groups.isEmpty()) {
            group = groups.get(0);
        }

        String roleName = null;
        for (LdapGroupMappingProperties.GroupMapping mapping : groupMappingProperties.getLdapGroupMapping()) {
            if (Objects.equals(group, mapping.getLdapGroup())) {
                roleName = mapping.getGroup();
                break;
            }
        }

        return new SimpleGrantedAuthority(roleName);
    }
}
