/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import org.hibernate.annotations.CreationTimestamp;

import java.util.Date;

/**
 * Single-use hand-off between the OIDC callback endpoint (browser navigation) and
 * /oidc/exchange (called by the frontend), which is where the JWT is issued. Keeps the
 * authorization code and the access token out of the browser, and carries the hash of the client
 * nonce so that only the browser the ticket was issued to can spend it.
 */
@Entity
@Table(name = "oidc_login_ticket")
public class OidcLoginTicket {

    @Id
    @Column(name = "ticket", length = 128)
    private String ticket;

    @Column(name = "identity", columnDefinition = "TEXT")
    private String identity;

    @Column(name = "client_nonce_hash", length = 64)
    private String clientNonceHash;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "expires_at")
    private Date expiresAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "used_at")
    private Date usedAt;

    public String getTicket() {
        return ticket;
    }

    public void setTicket(String ticket) {
        this.ticket = ticket;
    }

    public String getIdentity() {
        return identity;
    }

    public void setIdentity(String identity) {
        this.identity = identity;
    }

    public String getClientNonceHash() {
        return clientNonceHash;
    }

    public void setClientNonceHash(String clientNonceHash) {
        this.clientNonceHash = clientNonceHash;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Date getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Date usedAt) {
        this.usedAt = usedAt;
    }
}
