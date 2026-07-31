/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil;

import com.becon.opencelium.backend.resource.LdapConfigDTO;
import com.unboundid.ldap.listener.InMemoryDirectoryServer;
import com.unboundid.ldap.listener.InMemoryDirectoryServerConfig;
import com.unboundid.ldap.listener.InMemoryListenerConfig;
import com.unboundid.ldap.sdk.Entry;

/**
 * In-process LDAP server fixture for slice tests of LDAP-touching services.
 *
 * Tests should hold a single static instance via {@code @BeforeAll}/{@code @AfterAll}
 * because (a) the server is read-only across tests, (b) startup cost matters,
 * and (c) the port is auto-assigned at start time, so the URL must be exposed
 * back to each test.
 *
 * Seeded layout:
 * <pre>
 *   dc=oc,dc=test                       — base
 *   cn=admin,dc=oc,dc=test              — bind DN, password "adminpw"
 *   ou=people,dc=oc,dc=test
 *     uid=alice,ou=people,dc=oc,dc=test — password "alicepw"
 *     uid=bob,ou=people,dc=oc,dc=test   — password "bobpw"
 * </pre>
 */
public final class LdapTestServer {

    public static final String BASE_DN = "dc=oc,dc=test";
    public static final String ADMIN_DN = "cn=admin," + BASE_DN;
    public static final String ADMIN_PASSWORD = "adminpw";
    public static final String USER_DN = "ou=people," + BASE_DN;
    public static final String USER_SEARCH_FILTER = "(uid={0})";
    public static final String ALICE_PASSWORD = "alicepw";
    public static final int SEEDED_USER_COUNT = 2;

    private final InMemoryDirectoryServer server;

    private LdapTestServer(InMemoryDirectoryServer server) {
        this.server = server;
    }

    public static LdapTestServer start() throws Exception {
        InMemoryDirectoryServerConfig config = new InMemoryDirectoryServerConfig(BASE_DN);
        config.addAdditionalBindCredentials(ADMIN_DN, ADMIN_PASSWORD);
        // Port 0 → OS picks a free port; we read it back after start().
        config.setListenerConfigs(InMemoryListenerConfig.createLDAPConfig("default", 0));
        // Without an explicit schema the SDK uses the standard LDAP schema —
        // sufficient for the objectClasses we seed below.
        config.setSchema(null);

        InMemoryDirectoryServer server = new InMemoryDirectoryServer(config);
        // The varargs Entry(String...) ctor expects LDIF lines, so the DN line
        // must carry the literal "dn: " prefix.
        server.add(new Entry(
                "dn: " + BASE_DN,
                "objectClass: top",
                "objectClass: domain",
                "dc: oc"));
        server.add(new Entry(
                "dn: " + USER_DN,
                "objectClass: top",
                "objectClass: organizationalUnit",
                "ou: people"));
        server.add(new Entry(
                "dn: uid=alice," + USER_DN,
                "objectClass: top",
                "objectClass: person",
                "objectClass: inetOrgPerson",
                "uid: alice",
                "cn: Alice",
                "sn: Anderson",
                "userPassword: " + ALICE_PASSWORD));
        server.add(new Entry(
                "dn: uid=bob," + USER_DN,
                "objectClass: top",
                "objectClass: person",
                "objectClass: inetOrgPerson",
                "uid: bob",
                "cn: Bob",
                "sn: Brown",
                "userPassword: bobpw"));

        server.startListening();
        return new LdapTestServer(server);
    }

    public String url() {
        return "ldap://localhost:" + server.getListenPort();
    }

    public void stop() {
        server.shutDown(true);
    }

    /**
     * Pre-populated {@link LdapConfigDTO} pointing at this server. Tests mutate
     * one field at a time to land on the branch under test.
     */
    public LdapConfigDTO validConfig() {
        LdapConfigDTO config = new LdapConfigDTO();
        config.setUrls(url());
        config.setUsername(ADMIN_DN);
        config.setPassword(ADMIN_PASSWORD);
        config.setTimeout("5000");
        config.setUserDN(USER_DN);
        config.setGroupDN("");
        config.setUserSearchFilter(USER_SEARCH_FILTER);
        config.setGroupSearchFilter("");
        return config;
    }
}
