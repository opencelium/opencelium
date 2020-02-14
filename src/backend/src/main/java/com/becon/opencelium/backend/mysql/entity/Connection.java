/*
 * // Copyright (C) <2019> <becon GmbH>
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

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "connection")
public class Connection   {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "from_connector")
    private int fromConnector;

    @Column(name = "to_connector")
    private int toConnector;

    @OneToMany(mappedBy = "connection", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<Enhancement> enhancements;

    @OneToMany(mappedBy = "connection", fetch = FetchType.LAZY)
    private List<Scheduler> schedulers;

    public Connection() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(int fromConnector) {
        this.fromConnector = fromConnector;
    }

    public int getToConnector() {
        return toConnector;
    }

    public void setToConnector(int toConnector) {
        this.toConnector = toConnector;
    }

    public List<Enhancement> getEnhancements() {
        return enhancements;
    }

    public void setEnhancements(List<Enhancement> enhancements) {
        this.enhancements = enhancements;
    }

    public List<Scheduler> getSchedulers() {
        return schedulers;
    }

    public void setSchedulers(List<Scheduler> schedulers) {
        this.schedulers = schedulers;
    }
}
