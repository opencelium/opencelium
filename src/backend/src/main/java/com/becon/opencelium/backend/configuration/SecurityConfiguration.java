/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.configuration;

import com.becon.opencelium.backend.security.AuthExceptionHandler;
import com.becon.opencelium.backend.security.AuthenticationFilter;
import com.becon.opencelium.backend.security.AuthorizationFilter;
import com.becon.opencelium.backend.security.DaoUserDetailsService;
import com.becon.opencelium.backend.security.TotpAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.ProviderNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Lazy
    @Autowired
    private AuthenticationFilter authenticationFilter;

    @Lazy
    @Autowired
    private  AuthorizationFilter authorizationFilter;

    @Lazy
    @Autowired
    private  TotpAuthenticationFilter totpAuthenticationFilter;

    @Autowired
    private AuthExceptionHandler authExceptionHandler;

    @Autowired
    private DaoUserDetailsService daoUserDetailsService;

    @Autowired
    private LdapProperties ldapProperties;

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfiguration.class);


    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception{
        return http
                .cors()
                .and()
                .csrf().disable()
                .authorizeHttpRequests(auth -> auth
                        .anyRequest()
                        .authenticated())
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .addFilter(authenticationFilter)
                .addFilterBefore(totpAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(authorizationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling()
                .authenticationEntryPoint(authExceptionHandler)
                .and().build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder
                .authenticationProvider(ldapAuthenticationProvider())
                .authenticationProvider(daoAuthenticationProvider());

        return authenticationManagerBuilder.build();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        final DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setPasswordEncoder(bCryptPasswordEncoder);
        authenticationProvider.setUserDetailsService(daoUserDetailsService);

        return authenticationProvider;
    }

    @Bean
    public LdapAuthenticationProvider ldapAuthenticationProvider() {
        return new LdapAuthenticationProvider(ldapAuthenticator(), ldapAuthoritiesPopulator()){
            @Override
            protected DirContextOperations doAuthentication(UsernamePasswordAuthenticationToken authentication) {
                try {
                    return super.doAuthentication(authentication);
                } catch (InternalAuthenticationServiceException e) {
                    // move next authentication if LDAP server is not available
                    if (ldapProperties.isShowLogs()) {
                        logger.info(ldapProperties.getConfiguration());
                    }
                    throw new ProviderNotFoundException(e.getMessage());
                }
            }
        };
    }

    @Bean
    public LdapAuthenticator ldapAuthenticator() {
        String userSearchBase = ldapProperties.getUserSearchBase() + "," + ldapProperties.getBase();
        String searchFilter = ldapProperties.getUserSearchFilter();

        BindAuthenticator authenticator = new BindAuthenticator(ldapContextSource());
        authenticator.setUserSearch(new FilterBasedLdapUserSearch(userSearchBase, searchFilter, ldapContextSource()));

        return authenticator;
    }

    @Bean
    public LdapAuthoritiesPopulator ldapAuthoritiesPopulator() {
        String groupSearchBase = ldapProperties.getGroupSearchBase() + "," + ldapProperties.getBase();
        String searchFilter = ldapProperties.getGroupSearchFilter();

        DefaultLdapAuthoritiesPopulator authoritiesPopulator = new DefaultLdapAuthoritiesPopulator(ldapContextSource(), groupSearchBase);
        authoritiesPopulator.setGroupSearchFilter(searchFilter);
        authoritiesPopulator.setAuthorityMapper(this::ldapAuthorityMapper);

        return authoritiesPopulator;
    }

    @Bean
    public LdapContextSource ldapContextSource() {
        LdapContextSource contextSource = new LdapContextSource();

        contextSource.setUrl(ldapProperties.getUrls());
        contextSource.setUserDn(ldapProperties.getUsername());
        contextSource.setPassword(ldapProperties.getPassword());

        return contextSource;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addExposedHeader("GroupPermissionOperations, Authorization");

        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.setAllowedOriginPatterns(Collections.singletonList("*"));
        corsConfiguration.applyPermitDefaultValues();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        String[] enpoints = new String[] {
                "/api/storage/files/**",
                "/api/webhook/execute/**",
                "/api/webhook/health",
                "/v3/api-docs",
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/v3/api-docs/**",
                "/docs"};
        return (web) -> web.ignoring()
                .requestMatchers(enpoints);
    }


    private GrantedAuthority ldapAuthorityMapper(Map<String, List<String>> userGroups) {
        List<String> groups = userGroups.get(SpringSecurityLdapTemplate.DN_KEY);
        if (groups == null || groups.isEmpty()) {
            throw new AuthenticationServiceException("User should be a member of at least one group");
        }

        String ocRole = ldapProperties.getGroupRoleMapping().stream()
                .filter(mapping -> Objects.equals(groups.get(0), mapping.getLdapGroup()))
                .findFirst()
                .map(LdapProperties.Group2Role::getOcRole)
                .orElse(ldapProperties.getDefaultRole());

        return new SimpleGrantedAuthority(ocRole);
    }
}
