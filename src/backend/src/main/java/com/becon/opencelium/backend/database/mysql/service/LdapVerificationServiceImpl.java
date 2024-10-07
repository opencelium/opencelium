package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.resource.LdapConfigDTO;
import org.springframework.ldap.NameNotFoundException;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.stereotype.Service;

import javax.naming.Context;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

@Service
public class LdapVerificationServiceImpl implements LdapVerificationService {
    @Override
    public List<String> collectMessages(LdapConfigDTO config) {
        List<String> messages = new ArrayList<>();

        // host is reachable ?
        try {
            messages.add(checkHost(config.getUrls()));
        } catch (Throwable th) {
            messages.add(th.getMessage());
            return messages;
        }

        // user has read access to directory ?
        try {
            messages.add(checkAdminCredentials(config.getUrls(), config.getUsername(), config.getPassword()));
        } catch (Throwable th) {
            messages.add(th.getMessage());
            return messages;
        }

        // count users under userDN
        try {
            messages.add(countUsers(config));
        } catch (Throwable th) {
            messages.add(th.getMessage());
            return messages;
        }
        messages.add("to identity success and fail");

        return messages;
    }


    private String checkHost(String url) {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "none");

            DirContext ctx = new InitialDirContext(env);
            ctx.getAttributes("");
            ctx.close();
            return "Host = '" + url + "' is reachable";
        } catch (NamingException e) {
            throw new RuntimeException("Host = '" + url + "' is not reachable");
        }
    }

    private String checkAdminCredentials(String url, String username, String password) {
        Hashtable<String, String> env = new Hashtable<>();
        try {
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put(Context.PROVIDER_URL, url);
            env.put(Context.SECURITY_AUTHENTICATION, "simple");
            env.put(Context.SECURITY_PRINCIPAL, username);
            env.put(Context.SECURITY_CREDENTIALS, password);

            DirContext ctx = new InitialDirContext(env);
            ctx.close();

            return "User with username = '" + username + "' and password = '" + password + "' has access to host = '" + url + "'";
        } catch (NamingException e) {
            throw new RuntimeException("User with username = '" + username + "' and password = '" + password + "' does not have access to host = '" + url + "'");
        }
    }

    private String countUsers(LdapConfigDTO config) {
        LdapContextSource contextSource = new LdapContextSource();

        contextSource.setUrl(config.getUrls());
        contextSource.setBase("");
        contextSource.setUserDn(config.getUsername());
        contextSource.setPassword(config.getPassword());
        contextSource.afterPropertiesSet();

        LdapTemplate ldapTemplate = new LdapTemplate(contextSource);
        try {
            List<Object> users = ldapTemplate.search(
                    config.getUserDN(),
                    "(objectClass=person)",
                    Attributes::clone
            );

            return "Host = '" + config.getUrls() + "' has " + users.size() + " users under userDN = '" + config.getUserDN() + "'";
        } catch (NameNotFoundException e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
