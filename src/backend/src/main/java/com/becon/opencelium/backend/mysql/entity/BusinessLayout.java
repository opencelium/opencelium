package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.blayout.BusinessLayoutResource;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "business_layout")
public class BusinessLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(name = "name")
    private String name;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id")
    private Connection connection;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BLsvgItem> svgItems;

    @OneToMany(mappedBy = "bLayout", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BLarrow> arrows;

    public BusinessLayout() {
    }

    public BusinessLayout(BusinessLayoutResource businessLayoutResource) {
        this.id = businessLayoutResource.getId();
        this.arrows = businessLayoutResource.getArrows().stream().map(ar -> new BLarrow(ar, this)).collect(Collectors.toList());
        this.svgItems = businessLayoutResource.getSvgItems().stream().map(svg -> new BLsvgItem(svg, this)).collect(Collectors.toList());
    }

    public BusinessLayout(BusinessLayoutResource businessLayoutResource, Connection connection) {
        this.id = businessLayoutResource.getId();
        this.arrows = businessLayoutResource.getArrows().stream().map(ar -> new BLarrow(ar, this)).collect(Collectors.toList());
        this.svgItems = businessLayoutResource.getSvgItems().stream().map(svg -> new BLsvgItem(svg, this)).collect(Collectors.toList());
        this.connection = connection;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Connection getConnection() {
        return connection;
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public List<BLsvgItem> getSvgItems() {
        return svgItems;
    }

    public void setSvgItems(List<BLsvgItem> svgItems) {
        this.svgItems = svgItems;
    }

    public List<BLarrow> getArrows() {
        return arrows;
    }

    public void setArrows(List<BLarrow> arrows) {
        this.arrows = arrows;
    }
}
