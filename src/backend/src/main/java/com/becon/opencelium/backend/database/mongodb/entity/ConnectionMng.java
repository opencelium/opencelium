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

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Document(collection = "connection")
public class ConnectionMng {
    @Id
    private String id; // id generated in mongodb
    @Field(name = "connection_id")
    private Long connectionId; // id generated in mariadb.
    private String title;
    private String description;
    @DBRef
    @Field(name = "from_connector")
    private ConnectorNodeMng fromConnector;
    @DBRef
    @Field(name = "to_connector")
    private ConnectorNodeMng toConnector;
    @DBRef
    @Field(name = "field_binding")
    private List<FieldBindingMng> fieldBinding;
    @DBRef
    @Field(name = "data_aggregator")
    private DataAggregatorMng dataAggregator;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ConnectorNodeMng getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorNodeMng fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorNodeMng getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorNodeMng toConnector) {
        this.toConnector = toConnector;
    }

    public List<FieldBindingMng> getFieldBinding() {
        return fieldBinding;
    }

    public void setFieldBinding(List<FieldBindingMng> fieldBinding) {
        this.fieldBinding = fieldBinding;
    }

    public DataAggregatorMng getDataAggregator() {
        return dataAggregator;
    }

    public void setDataAggregator(DataAggregatorMng dataAggregator) {
        this.dataAggregator = dataAggregator;
    }
}
