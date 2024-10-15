package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.resource.LdapConfigDTO;
import com.becon.opencelium.backend.resource.LdapVerificationMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.NameNotFoundException;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.ldap.core.support.LookupAttemptingCallback;
import org.springframework.ldap.query.LdapQuery;
import org.springframework.stereotype.Service;

import javax.naming.Context;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

import static org.springframework.ldap.query.LdapQueryBuilder.query;

@Service
public class LdapVerificationServiceImpl implements LdapVerificationService {

    @Autowired
    private LdapProperties properties;

    private static final Logger logger = LoggerFactory.getLogger(LdapVerificationService.class);

    @Override
    public void validateAndLog(Object principal, Object credentials) {
        if (!properties.isShowLogs()) {
            return;
        }

        LdapConfigDTO config = new LdapConfigDTO();

        config.setUrls(properties.getUrls());
        config.setUserDN(properties.getUserSearchBase());
        config.setGroupDN(properties.getGroupSearchBase());
        config.setUsername(properties.getUsername());
        config.setPassword(properties.getPassword());
        config.setTimeout(properties.getTimeout());
        config.setUserSearchFilter(properties.getUserSearchFilter());
        config.setGroupSearchFilter(properties.getGroupSearchFilter());

        try {
            // verify timeout is not null
            validateTimeout(config.getTimeout());

            // host is reachable ?
            logger.info(checkHost(config.getUrls(), config.getTimeout()));

            // user has read access to directory ?
            logger.info(checkAdminCredentials(config.getUrls(), config.getUsername(), config.getPassword(), config.getTimeout()));

            // principal exists ?
            logger.info(validateLoginPrincipal(config, principal));

            // principals' password correct ?
            logger.info(validateLoginCredential(config, principal, credentials));
        } catch (Throwable th) {
            logger.warn(th.getMessage());
        }
    }

    @Override
    public List<LdapVerificationMessageDTO> collectMessages(LdapConfigDTO config) {
        List<LdapVerificationMessageDTO> messages = new ArrayList<>();

        String title = null;
        String message;
        try {
            // verify timeout is not null
            title = "Timeout";
            validateTimeout(config.getTimeout());

            // host is reachable ?
            title = "Host";
            message = checkHost(config.getUrls(), config.getTimeout());
            messages.add(LdapVerificationMessageDTO.of(title, message));

            // user has read access to directory ?
            title = "User credentials";
            message = checkAdminCredentials(config.getUrls(), config.getUsername(), config.getPassword(), config.getTimeout());
            messages.add(LdapVerificationMessageDTO.of(title, message));

            // count users under userDN
            title = "Found entries";
            message = countUsers(config);
            messages.add(LdapVerificationMessageDTO.of(title, message));

            messages.add(new LdapVerificationMessageDTO("STATUS CODE", "To distinguish success or fail"));
        } catch (RuntimeException e) {
            messages.add(LdapVerificationMessageDTO.of(title, e.getMessage()));
        }

        return messages;
    }


    private void validateTimeout(String timeout) {
        if (timeout == null) {
            throw new RuntimeException("'timeout' in Ldap configuration should be not null");
        }
    }

    private String checkHost(String url, String timeout) {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "none");
            env.put(LdapProperties.CONNECT_TIMEOUT_KEY, timeout);
            env.put(LdapProperties.READ_TIMEOUT_KEY, timeout);

            DirContext ctx = new InitialDirContext(env);
            ctx.getAttributes("");
            ctx.close();

            return "Host = '" + url + "' is reachable";
        } catch (NamingException e) {
            throw new RuntimeException("Host = '" + url + "' is not reachable");
        }
    }

    private String checkAdminCredentials(String url, String username, String password, String timeout) {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, username);
            env.put(Context.SECURITY_CREDENTIALS, password);
            env.put(LdapProperties.CONNECT_TIMEOUT_KEY, timeout);
            env.put(LdapProperties.READ_TIMEOUT_KEY, timeout);

            DirContext ctx = new InitialDirContext(env);
            ctx.close();

            return "username = '" + username + "' and password = '" + password + "' has access to host = '" + url + "'";
        } catch (NamingException e) {
            throw new RuntimeException("username = '" + username + "' and password = '" + password + "' does not have access to host = '" + url + "'");
        }
    }

    private String countUsers(LdapConfigDTO config) {
        LdapTemplate ldapTemplate = createLdapTemplate(config);

        try {
            List<Object> users = ldapTemplate.search(
                    config.getUserDN(),
                    "(objectClass=person)",
                    Attributes::clone
            );

            return "Found " + users.size() + " users under userDN = '" + config.getUserDN() + "'";
        } catch (NameNotFoundException e) {
            throw new RuntimeException("Could not count users under userDN = '" + config.getUserDN() + "'");
        }
    }

    private String validateLoginPrincipal(LdapConfigDTO config, Object principal) {
        LdapTemplate ldapTemplate = createLdapTemplate(config);

        LdapQuery query = query()
                .base(config.getUserDN())
                .filter(config.getUserSearchFilter(), principal);

        List<Object> users = ldapTemplate.search(query, Attributes::clone);

        if (users == null || users.isEmpty()) {
            throw new RuntimeException("Principal = '" + principal + "' does not exist under userDN = '" + config.getUserDN() + "'");
        }

        if (users.size() == 1) {
            return "One record with principal = '" + principal + "' under userDN = '" + config.getUserDN() + "'";
        } else {
            return users.size() + " records with principal = '" + principal + "' under userDN = '" + config.getUserDN() + "'";
        }
    }

    private String validateLoginCredential(LdapConfigDTO config, Object principal, Object credential) {
        LdapTemplate ldapTemplate = createLdapTemplate(config);

        try {
            LdapQuery query = query()
                    .base(config.getUserDN())
                    .filter(config.getUserSearchFilter(), principal);

            ldapTemplate.authenticate(query, (String) credential, new LookupAttemptingCallback());

            return "principal = '" + principal + "' and credential = '" + credential + "' is valid under userDN = '" + config.getUserDN() + "'";
        } catch (Exception e) {
            throw new RuntimeException("principal = '" + principal + "' and credential = '" + credential + "' is not valid under userDN = '" + config.getUserDN() + "'");
        }
    }

    private static LdapTemplate createLdapTemplate(LdapConfigDTO config) {
        LdapContextSource contextSource = new LdapContextSource();

        contextSource.setUrl(config.getUrls());
        contextSource.setBase("");
        contextSource.setUserDn(config.getUsername());
        contextSource.setPassword(config.getPassword());
        contextSource.afterPropertiesSet();

        Hashtable<String, Object> env = new Hashtable<>();
        env.put(LdapProperties.CONNECT_TIMEOUT_KEY, config.getTimeout());
        env.put(LdapProperties.READ_TIMEOUT_KEY, config.getTimeout());
        contextSource.setBaseEnvironmentProperties(env);

        return new LdapTemplate(contextSource);
    }
}
