/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.invoker.entity.Invoker;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class InvokerFixture {

    public static final String DELL_WARRANTY = "Dell Warranty";

    private InvokerFixture() {}

    // ── Entity factories ──────────────────────────────────────────────────────


    public static Invoker anInvokerNamed(String name) {
        Invoker invoker = new Invoker();
        invoker.setName(name);
        return invoker;
    }

    public static Invoker aDellWarrantyInvoker() {
        return anInvokerNamed(DELL_WARRANTY);
    }

    // ── File content factories ────────────────────────────────────────────────


    public static String anInvokerFileDeclaring(String name) {
        return "<invoker type=\"json\"><name>" + name + "</name></invoker>";
    }

    public static Document anInvokerDocumentDeclaring(String name) {
        try {
            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            return builder.parse(anInvokerFileStreamDeclaring(name));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build an invoker document for '" + name + "'", e);
        }
    }

    public static InputStream anInvokerFileStreamDeclaring(String name) {
        return new ByteArrayInputStream(anInvokerFileDeclaring(name).getBytes(StandardCharsets.UTF_8));
    }
}
