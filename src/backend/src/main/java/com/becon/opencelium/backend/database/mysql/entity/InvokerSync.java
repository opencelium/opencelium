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

package com.becon.opencelium.backend.database.mysql.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoker_sync")
@EntityListeners(AuditingEntityListener.class)
public class InvokerSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "invoker_name")
    private String invokerName;

    @Column(name = "sp_invoker_file_name")
    private String spInvokerFileName;

    @Column(name = "invoker_content_hmac")
    private String invokerContentHmac;

    @Column(name = "manually_modified")
    private boolean manuallyModified;

    @JsonIgnore
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getInvokerName() {
        return invokerName;
    }

    public void setInvokerName(String invokerName) {
        this.invokerName = invokerName;
    }

    public String getSpInvokerFileName() {
        return spInvokerFileName;
    }

    public void setSpInvokerFileName(String spInvokerFileName) {
        this.spInvokerFileName = spInvokerFileName;
    }

    public String getInvokerContentHmac() {
        return invokerContentHmac;
    }

    public void setInvokerContentHmac(String invokerContentHmac) {
        this.invokerContentHmac = invokerContentHmac;
    }

    public boolean isManuallyModified() {
        return manuallyModified;
    }

    public void setManuallyModified(boolean manuallyModified) {
        this.manuallyModified = manuallyModified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
