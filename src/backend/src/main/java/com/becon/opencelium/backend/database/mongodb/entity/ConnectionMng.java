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

package com.becon.opencelium.backend.database.mongodb.entity;

import jakarta.persistence.EntityListeners;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "connection")
@EntityListeners(AuditingEntityListener.class)
public class ConnectionMng {

    private String version;

    @MongoId(targetType = FieldType.OBJECT_ID)
    private String id; // id generated in mongodb

    @Indexed
    @Field(name = "connection_id")
    private Long connectionId; // id generated in mariadb.

    @Field(name = "from_connector")
    private ConnectorMng fromConnector;

    @Field(name = "to_connector")
    private ConnectorMng toConnector;

    @DBRef
    @Field(name = "fieldBindings")
    private List<FieldBindingMng> oldFieldBindings; // [null, null, null]

    @Field(name = "field_bindings")
    private List<FieldBindingMng> fieldBindings;

    @Field(name = "comment")
    private String comment;

    private Map<String, Object> ui;

    @CreatedDate
    private Instant createdAt;

    @CreatedBy
    private Integer createdBy;

    public ConnectionMng() {
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public ConnectorMng getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorMng fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorMng getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorMng toConnector) {
        this.toConnector = toConnector;
    }

    public List<FieldBindingMng> getFieldBindings() {
        return fieldBindings;
    }

    public void setFieldBindings(List<FieldBindingMng> fieldBindings) {
        this.fieldBindings = fieldBindings;
    }

    public Map<String, Object> getUi() {
        return ui;
    }

    public void setUi(Map<String, Object> ui) {
        this.ui = ui;
    }

    public List<FieldBindingMng> getOldFieldBindings() {
        return oldFieldBindings;
    }

    public void setOldFieldBindings(List<FieldBindingMng> oldFieldBindings) {
        this.oldFieldBindings = oldFieldBindings;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
