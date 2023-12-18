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
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "connection")
@EntityListeners(AuditingEntityListener.class)
public class Connection   {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "from_connector")
    private int fromConnector;

    @Column(name = "to_connector")
    private int toConnector;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Integer createdBy;

    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_on", updatable = false)
    private Date createdOn;

    @LastModifiedBy
    @Column(name = "modified_by")
    private Integer modifiedBy;

    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "modified_on")
    private Date modifiedOn;

    @Column(name = "icon")
    private String icon;

    @OneToMany(mappedBy = "connection", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<Enhancement> enhancements;

    @LazyCollection(LazyCollectionOption.FALSE)
    @OneToMany(mappedBy = "connection")
    private List<Scheduler> schedulers;

    @JsonIgnore
    @OneToOne(mappedBy = "connection", cascade = CascadeType.ALL, orphanRemoval = true)
    private BusinessLayout businessLayout;

    public Connection() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Date createdOn) {
        this.createdOn = createdOn;
    }

    public Integer getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(Integer modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Date getModifiedOn() {
        return modifiedOn;
    }

    public void setModifiedOn(Date modifiedOn) {
        this.modifiedOn = modifiedOn;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
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

    public BusinessLayout getBusinessLayout() {
        return businessLayout;
    }

    public void setBusinessLayout(BusinessLayout businessLayout) {
        this.businessLayout = businessLayout;
    }

    @Override
    public String toString() {
        return "Connection{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", fromConnector=" + fromConnector +
                ", toConnector=" + toConnector +
                ", createdBy=" + createdBy +
                ", createdOn=" + createdOn +
                ", modifiedBy=" + modifiedBy +
                ", modifiedOn=" + modifiedOn +
                ", enhancements=" + enhancements +
                ", schedulers=" + schedulers +
                ", businessLayout=" + businessLayout +
                ", icon=" + icon +
                '}';
    }
}
