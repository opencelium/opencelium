package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "secret_key_for_encoder")
public class SecretKey {
    @Id
    @Column(name = "secret_key")
    private String secretKey;

    public SecretKey() {
    }

    public SecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }
}
