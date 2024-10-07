package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.configuration.LdapProperties;
import com.becon.opencelium.backend.resource.LdapConfigDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.NameNotFoundException;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
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
    public void showLogs(LdapProperties properties, String username) {
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

        List<String> messages = new ArrayList<>();
        try {
            // host is reachable ?
            checkHost(config.getUrls(), config.getTimeout(), messages);
            logger.info(messages.get(0));

            // user has read access to directory ?
            checkAdminCredentials(config.getUrls(), config.getUsername(), config.getPassword(), config.getTimeout(), messages);
            logger.info(messages.get(1));

            // user exists ?
            logger.info(userExists(config, username));
        } catch (Throwable th) {
            logger.warn(th.getMessage());
        }
    }

    @Override
    public List<String> collectMessages(LdapConfigDTO config) {
        List<String> messages = new ArrayList<>();

        try {
            // host is reachable ?
            checkHost(config.getUrls(), config.getTimeout(), messages);

            // user has read access to directory ?
            checkAdminCredentials(config.getUrls(), config.getUsername(), config.getPassword(), config.getTimeout(), messages);

            // count users under userDN
            countUsers(config, messages);

            messages.add("to identity success and fail");
        } catch (Throwable th) {
            logger.warn(th.getMessage());
        }

        return messages;
    }


    private void checkHost(String url, long timeout, List<String> messages) {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "none");
            env.put(LdapProperties.CONNECT_TIMEOUT_KEY, String.valueOf(timeout));
            env.put(LdapProperties.READ_TIMEOUT_KEY, String.valueOf(timeout));

            DirContext ctx = new InitialDirContext(env);
            ctx.getAttributes("");
            ctx.close();
            messages.add("Host = '" + url + "' is reachable");
        } catch (NamingException e) {
            messages.add("Host = '" + url + "' is not reachable");
            throw new RuntimeException("Host = '" + url + "' is not reachable");
        }
    }

    private void checkAdminCredentials(String url, String username, String password, long timeout, List<String> messages) throws NamingException {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, username);
            env.put(Context.SECURITY_CREDENTIALS, password);
            env.put(LdapProperties.CONNECT_TIMEOUT_KEY, String.valueOf(timeout));
            env.put(LdapProperties.READ_TIMEOUT_KEY, String.valueOf(timeout));

            DirContext ctx = new InitialDirContext(env);
            ctx.close();

            messages.add("User with username = '" + username + "' and password = '" + password + "' has access to host = '" + url + "'");
        } catch (NamingException e) {
            messages.add("User with username = '" + username + "' and password = '" + password + "' does not have access to host = '" + url + "'");
            throw e;
        }
    }

    private void countUsers(LdapConfigDTO config, List<String> messages) {
        LdapTemplate ldapTemplate = createLdapTemplate(config);
        try {
            List<Object> users = ldapTemplate.search(
                    config.getUserDN(),
                    "(objectClass=person)",
                    Attributes::clone
            );

            messages.add("Host = '" + config.getUrls() + "' has " + users.size() + " users under userDN = '" + config.getUserDN() + "'");
        } catch (NameNotFoundException e) {
            messages.add("Could not count users in host = '" + config.getUrls() + "' under userDN = '" + config.getUserDN() + "'");
            throw e;
        }
    }

    private String userExists(LdapConfigDTO config, String username) {
        LdapTemplate ldapTemplate = createLdapTemplate(config);
        LdapQuery query = query()
                .base(config.getUserDN())
                .filter(config.getUserSearchFilter(), username);

        List<Object> users = ldapTemplate.search(query, Attributes::clone);

        if (users == null || users.isEmpty()) {
            throw new RuntimeException("User with username='" + username + "' does not exist in host = '" + config.getUrls() + "' under userSearchBase = '" + config.getUserDN() + "'");
        }

        return "User with username='" + username + "' exists in host = '" + config.getUrls() + "' under userSearchBase = '" + config.getUserDN() + "'";
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
