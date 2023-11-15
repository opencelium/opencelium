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

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.*;

import java.util.List;

@Document(collection = "connection")
public class ConnectionMng {
    @MongoId(targetType = FieldType.OBJECT_ID)
    private String id; // id generated in mongodb
    @Field(name = "connection_id")
    @Indexed
    private Long connectionId; // id generated in mariadb.
    private String title;
    @Field(name = "from_connector")
    private ConnectorMng fromConnector;
    @Field(name = "to_connector")
    private ConnectorMng toConnector;

    @DBRef
    private List<FieldBindingMng> fieldBindings;
    public ConnectionMng() {
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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
}
