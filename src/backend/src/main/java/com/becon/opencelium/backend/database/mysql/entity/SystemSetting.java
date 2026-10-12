package com.becon.opencelium.backend.database.mysql.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

/**
 * A global, admin-managed setting that applies to every user — as opposed to the per-user
 * preferences on {@code detail}. The {@code value} column holds an opaque JSON string whose shape
 * is owned by the consumer (the frontend for {@code theme_colors}), so settings can evolve without
 * schema migrations. See {@code docs/settings/system-settings.md} for the design decision.
 */
@Entity
@Table(name = "system_setting")
@EntityListeners(AuditingEntityListener.class)
public class SystemSetting {

    @Id
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private Integer updatedBy;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }
}
