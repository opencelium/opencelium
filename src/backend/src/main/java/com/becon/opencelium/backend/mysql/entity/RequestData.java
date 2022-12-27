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

package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.invoker.entity.RequiredData;

import jakarta.persistence.*;

@Entity
@Table(name = "request_data")
public class RequestData {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "field")
    private String field;

    @Column(name = "value")
    private String value;

    @Column(name = "visibility")
    private String visibility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connector_id")
    private Connector connector;

    public RequestData() {
    }

    public RequestData(String field, String value) {
        this.field = field;
        this.value = value;
    }

    public RequestData(RequiredData requiredData){
        this.field = requiredData.getName();
        this.value = requiredData.getValue();
        this.visibility = requiredData.getVisibility();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public Connector getConnector() {
        return connector;
    }

    public void setConnector(Connector connector) {
        this.connector = connector;
    }

    @Override
    public String toString() {
        return "RequestData{" +
                "id=" + id +
                ", field='" + field + '\'' +
                ", value='" + value + '\'' +
                ", visibility='" + visibility + '\'' +
                ", connector=" + connector +
                '}';
    }
}
